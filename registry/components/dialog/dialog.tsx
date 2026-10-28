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
import { CircleAlert, CircleCheck, CircleX, Info } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type DialogTone = "neutral" | "success" | "warning" | "danger";
export type DialogActions = "confirm" | "close";

export interface DialogProps {
  /** Optional native interactive element that opens the dialog. */
  trigger?: ReactNode;
  /** Visible dialog heading. */
  title: ReactNode;
  /** Optional supporting text below the heading. */
  description?: ReactNode;
  /** Optional custom dialog body. */
  children?: ReactNode;
  /** Neutral or semantic treatment for the leading icon and continue button. */
  tone?: DialogTone;
  /** Optional icon. A semantic icon is used when omitted. */
  icon?: ReactNode;
  /** Whether to show close and continue, or a single close action. */
  actions?: DialogActions;
  /** Controlled open state. */
  open?: boolean;
  /** Initial uncontrolled open state. */
  defaultOpen?: boolean;
  /** Called whenever the requested open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Runs before the dialog closes after pressing Continue. */
  onContinue?: () => void;
  /** Runs when the dialog closes from any supported close action. */
  onClose?: () => void;
  /** Visible label for the primary action. */
  continueLabel?: ReactNode;
  /** Visible label for the close action. */
  closeLabel?: ReactNode;
  /** Disables the primary action while custom content is incomplete. */
  continueDisabled?: boolean;
  /** Dialog panel width in pixels. */
  width?: number;
  /** Dialog panel height in pixels. */
  height?: number;
  /** Prevents backdrop and Escape dismissal. The visible Close action remains available. */
  blocking?: boolean;
  /** Additional classes for the dialog panel. */
  className?: string;
}

interface DialogContextValue {
  close: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const defaultIcons: Record<DialogTone, ReactNode> = {
  neutral: <Info />,
  success: <CircleCheck />,
  warning: <CircleAlert />,
  danger: <CircleX />,
};

const iconClasses: Record<DialogTone, string> = {
  neutral: "bg-[var(--surface-muted)] text-[var(--text)]",
  success: "bg-[var(--success-surface)] text-[var(--success-surface-foreground)]",
  warning: "bg-[var(--warning-surface)] text-[var(--warning-surface-foreground)]",
  danger: "bg-[var(--danger-surface)] text-[var(--danger-surface-foreground)]",
};

const continueTones: Record<DialogTone, "primary" | "success" | "warning" | "danger"> = {
  neutral: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const DIALOG_WIDTH = 520;
const DIALOG_HEIGHT = 260;
const CLOSE_ONLY_DIALOG_HEIGHT = 236;

interface DialogRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function subscribeToPortal() {
  return () => undefined;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.closest("[aria-hidden=true], [inert]") && element.tabIndex >= 0 && element.getClientRects().length > 0);
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  tone = "neutral",
  icon,
  actions = "confirm",
  open,
  defaultOpen = false,
  onOpenChange,
  onContinue,
  onClose,
  continueLabel = "Continue",
  closeLabel = "Close",
  continueDisabled = false,
  width: requestedWidth,
  height: requestedHeight,
  blocking = false,
  className,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [triggerHidden, setTriggerHidden] = useState(defaultOpen && Boolean(trigger));
  const [hasTriggerOrigin, setHasTriggerOrigin] = useState(false);
  const [surfaceVisible, setSurfaceVisible] = useState(false);
  const [morph, setMorph] = useState<{ from: DialogRect; to: DialogRect }>({
    from: { left: 0, top: 0, width: 1, height: 1 },
    to: { left: 0, top: 0, width: DIALOG_WIDTH, height: DIALOG_HEIGHT },
  });
  const portalContainer = useSyncExternalStore(subscribeToPortal, () => document.body, () => null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const expanded = open ?? internalOpen;

  const setExpanded = useCallback((nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange, open]);

  const close = useCallback(() => {
    setExpanded(false);
    onClose?.();
  }, [onClose, setExpanded]);

  const calculateTargetRect = useCallback((): DialogRect => {
    const width = Math.min(requestedWidth ?? DIALOG_WIDTH, window.innerWidth - 32);
    const height = Math.min(
      requestedHeight ?? (actions === "close" ? CLOSE_ONLY_DIALOG_HEIGHT : DIALOG_HEIGHT),
      window.innerHeight - 32,
    );
    return {
      left: Math.max(16, (window.innerWidth - width) / 2),
      top: Math.max(16, (window.innerHeight - height) / 2),
      width,
      height,
    };
  }, [actions, requestedHeight, requestedWidth]);

  const openDialog = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    const source = event.target instanceof HTMLElement
      ? event.target.closest("button, [role='button']") as HTMLElement | null
      : null;
    const sourceRect = (source ?? triggerRef.current)?.getBoundingClientRect();
    const target = calculateTargetRect();

    if (sourceRect) {
      setMorph({
        from: { left: sourceRect.left, top: sourceRect.top, width: sourceRect.width, height: sourceRect.height },
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
  }, [calculateTargetRect, setExpanded]);

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

  useEffect(() => {
    if (!expanded || !surfaceVisible) return;
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [expanded, surfaceVisible]);

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
  const dialogIcon = icon ?? defaultIcons[tone];

  return (
    <DialogContext.Provider value={context}>
      {trigger ? (
        <span
          ref={triggerRef}
          className={`inline-flex ${expanded || triggerHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
          onClick={openDialog}
        >
          {trigger}
        </span>
      ) : null}
      {portalContainer ? createPortal(
        <>
          {surfaceVisible ? (
            <motion.button
              type="button"
              aria-label="Close dialog"
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
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={[
                  "fixed z-[231] box-border overflow-y-auto rounded-[32px] border border-[var(--border)] bg-[var(--surface)] pt-5 px-5 shadow-[var(--shadow-floating)] outline-none",
                  actions === "close" ? "pb-4" : "pb-5",
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
                <motion.div
                  className="relative z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={reduceMotion
                    ? { duration: 0.1 }
                    : expanded
                      ? { delay: 0.1, duration: motionTokens.duration.standard }
                      : { duration: motionTokens.duration.fast }}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className={`grid size-11 place-items-center rounded-[14px] [&>svg]:size-6 ${iconClasses[tone]}`} aria-hidden="true">
                      {dialogIcon}
                    </span>
                    <div className="mt-3 min-w-0">
                      <h2 id={titleId} className="text-lg font-[700] leading-6 text-[var(--text)]">{title}</h2>
                      {description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
                    </div>
                  </div>
                  {children ? <div className="mt-4 text-left">{children}</div> : null}
                  <div className="mt-5 flex items-center justify-center gap-3">
                    {actions === "confirm" ? <Button variant="text" tone="secondary" onClick={close}>{closeLabel}</Button> : null}
                    <Button
                      tone={actions === "confirm" ? continueTones[tone] : "primary"}
                      disabled={continueDisabled}
                      onClick={() => {
                        if (actions === "confirm") onContinue?.();
                        close();
                      }}
                    >
                      {actions === "confirm" ? continueLabel : closeLabel}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
          ) : null}
        </>,
        portalContainer,
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside Dialog.");
  return context;
}
