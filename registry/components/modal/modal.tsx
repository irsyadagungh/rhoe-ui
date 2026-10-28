"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface ModalContextValue {
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a Modal component.");
  }
  return context;
}

export interface ModalProps {
  /** Optional interactive element that triggers the modal with spatial morphing. */
  trigger?: ReactNode;
  /** Free-form content or render-function receiving helpers including close(). */
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  /** Optional visible or accessible modal title. */
  title?: ReactNode;
  /** Optional visible or accessible supporting description. */
  description?: ReactNode;
  /** Accessible label when no title is provided. */
  ariaLabel?: string;
  /** Controlled open state. */
  open?: boolean;
  /** Initial uncontrolled open state. */
  defaultOpen?: boolean;
  /** Called whenever the requested open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Runs when the modal closes from any close interaction. */
  onClose?: () => void;
  /** Shows or hides the built-in top-right close icon button. Defaults to true. */
  showCloseButton?: boolean;
  /** Prevents backdrop and Escape dismissal. */
  blocking?: boolean;
  /** Target width for the modal panel in pixels. Defaults to 520. */
  width?: number;
  /** Target height in pixels. Defaults to 340, clamped to the viewport. */
  height?: number;
  /** Additional CSS class names for the modal panel. */
  className?: string;
}

interface ModalRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const DEFAULT_MODAL_WIDTH = 520;
const DEFAULT_MODAL_HEIGHT = 340;

function subscribeToPortal() {
  return () => undefined;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.closest("[aria-hidden=true], [inert]") && element.tabIndex >= 0 && element.getClientRects().length > 0);
}

export function Modal({
  trigger,
  children,
  title,
  description,
  ariaLabel,
  open,
  defaultOpen = false,
  onOpenChange,
  onClose,
  showCloseButton = true,
  blocking = false,
  width: requestedWidth,
  height: requestedHeight,
  className,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [triggerHidden, setTriggerHidden] = useState(defaultOpen && Boolean(trigger));
  const [hasTriggerOrigin, setHasTriggerOrigin] = useState(false);
  const [surfaceVisible, setSurfaceVisible] = useState(false);
  const [morph, setMorph] = useState<{ from: ModalRect; to: ModalRect }>({
    from: { left: 0, top: 0, width: 1, height: 1 },
    to: { left: 0, top: 0, width: DEFAULT_MODAL_WIDTH, height: DEFAULT_MODAL_HEIGHT },
  });

  const portalContainer = useSyncExternalStore(subscribeToPortal, () => document.body, () => null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const expanded = open ?? internalOpen;

  const setExpanded = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open],
  );

  const close = useCallback(() => {
    setExpanded(false);
    onClose?.();
  }, [onClose, setExpanded]);

  // Compute centered target bounds on demand
  const calculateTargetRect = useCallback((): ModalRect => {
    const width = Math.min(requestedWidth ?? DEFAULT_MODAL_WIDTH, window.innerWidth - 32);
    const height = Math.min(requestedHeight ?? DEFAULT_MODAL_HEIGHT, window.innerHeight - 32);
    return {
      left: Math.max(16, (window.innerWidth - width) / 2),
      top: Math.max(16, (window.innerHeight - height) / 2),
      width,
      height,
    };
  }, [requestedHeight, requestedWidth]);

  const openFromTrigger = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      const source = event.target instanceof HTMLElement
        ? (event.target.closest("button, [role='button']") as HTMLElement | null)
        : null;
      const sourceRect = (source ?? triggerRef.current)?.getBoundingClientRect();
      const target = calculateTargetRect();

      if (sourceRect) {
        setMorph({
          from: {
            left: sourceRect.left,
            top: sourceRect.top,
            width: sourceRect.width,
            height: sourceRect.height,
          },
          to: target,
        });
        setHasTriggerOrigin(true);
      } else {
        setMorph({ from: target, to: target });
        setHasTriggerOrigin(false);
      }

      restoreFocusRef.current = source;
      setTriggerHidden(true);
      setSurfaceVisible(true);
      setExpanded(true);
    },
    [calculateTargetRect, setExpanded],
  );

  // Measure programmatic and initially open panels before making them visible.
  // Trigger openings already supply their measured bounds in the click handler.
  useEffect(() => {
    if (!expanded || surfaceVisible || !portalContainer) return;
    const frame = requestAnimationFrame(() => {
      const target = calculateTargetRect();
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setMorph({ from: target, to: target });
      setHasTriggerOrigin(false);
      setSurfaceVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [calculateTargetRect, expanded, portalContainer, surfaceVisible]);

  // Focus management
  useEffect(() => {
    if (!expanded || !surfaceVisible) return;
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [expanded, surfaceVisible]);

  // Keyboard navigation & trap
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !blocking) {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [blocking, close, expanded]);

  const context = useMemo(() => ({ close }), [close]);

  return (
    <ModalContext.Provider value={context}>
      {trigger ? (
        <span
          ref={triggerRef}
          className={`inline-flex ${expanded || triggerHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
          onClick={openFromTrigger}
        >
          {trigger}
        </span>
      ) : null}

      {portalContainer ? createPortal(
        <>
          {surfaceVisible ? (
            <motion.button
              type="button"
              aria-label="Close modal"
              className="fixed inset-0 z-[230] cursor-default bg-black/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={reduceMotion ? { duration: 0.1 } : { duration: motionTokens.duration.standard }}
              onClick={blocking ? undefined : close}
              tabIndex={-1}
            />
          ) : null}

          {surfaceVisible ? (
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={!title ? (ariaLabel ?? "Modal dialog") : undefined}
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              className={[
                "fixed z-[231] box-border overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-[var(--shadow-floating)] outline-none",
                className,
              ].filter(Boolean).join(" ")}
              initial={reduceMotion
                ? { opacity: 0 }
                : hasTriggerOrigin
                  ? { opacity: 1, ...morph.from }
                  : { opacity: 0, scale: 0.94, ...morph.to }}
              animate={expanded
                ? (hasTriggerOrigin
                    ? { opacity: 1, ...morph.to }
                    : { opacity: 1, scale: 1, ...morph.to })
                : (hasTriggerOrigin
                    ? { opacity: 1, ...morph.from }
                    : { opacity: 0, scale: 0.94, ...morph.to })}
              transition={reduceMotion
                ? { duration: 0.1 }
                : hasTriggerOrigin
                  ? motionTokens.spring.morph
                  : motionTokens.spring.smooth}
              onAnimationComplete={() => {
                if (expanded) return;
                setSurfaceVisible(false);
                setTriggerHidden(false);
                restoreFocusRef.current?.focus({ preventScroll: true });
              }}
            >
              {/* Trigger ghost for smooth morph exit */}
              {trigger && hasTriggerOrigin ? (
                <motion.div
                  aria-hidden="true"
                  {...({ inert: true } as Record<string, unknown>)}
                  className="pointer-events-none absolute inset-0 z-10 grid place-items-center whitespace-nowrap"
                  initial={{ opacity: hasTriggerOrigin ? 1 : 0 }}
                  animate={{ opacity: expanded ? 0 : 1 }}
                  transition={reduceMotion
                    ? { duration: 0.1 }
                    : expanded
                      ? { duration: motionTokens.duration.fast }
                      : { delay: 0.1, duration: motionTokens.duration.standard }}
                >
                  {trigger}
                </motion.div>
              ) : null}

              {/* Main modal content wrapper */}
              <motion.div
                className="relative z-20 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: expanded ? 1 : 0 }}
                transition={reduceMotion
                  ? { duration: 0.1 }
                  : expanded
                    ? { delay: 0.1, duration: motionTokens.duration.standard }
                    : { duration: motionTokens.duration.fast }}
              >
                {/* Header bar (if title, description, or close button present) */}
                {title || description || showCloseButton ? (
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {title ? (
                        <h2 id={titleId} className="text-lg font-[700] leading-6 text-[var(--text)]">
                          {title}
                        </h2>
                      ) : null}
                      {description ? (
                        <p id={descriptionId} className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
                          {description}
                        </p>
                      ) : null}
                    </div>
                    {showCloseButton ? (
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={close}
                        className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* Free-form children slot */}
                <div className="w-full">
                  {typeof children === "function" ? children({ close }) : children}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </>,
        portalContainer,
      ) : null}
    </ModalContext.Provider>
  );
}
