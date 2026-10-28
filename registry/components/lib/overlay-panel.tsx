"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { motionTokens } from "./motion-tokens";
import "../foundation.css";

export type OverlayPanelPlacement = "left" | "right" | "bottom";

export interface OverlayPanelProps {
  trigger?: ReactNode;
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  title?: ReactNode;
  description?: ReactNode;
  ariaLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement: OverlayPanelPlacement;
  showCloseButton?: boolean;
  blocking?: boolean;
  dragToDismiss?: boolean;
  size?: number | string;
  className?: string;
}

function subscribeToPortal() {
  return () => undefined;
}

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.closest("[aria-hidden=true], [inert]") && element.tabIndex >= 0 && element.getClientRects().length > 0);
}

function closedPosition(placement: OverlayPanelPlacement) {
  if (placement === "left") return { x: "-100%", y: 0 };
  if (placement === "right") return { x: "100%", y: 0 };
  return { x: 0, y: "100%" };
}

export function OverlayPanel({
  trigger,
  children,
  title,
  description,
  ariaLabel,
  open,
  defaultOpen = false,
  onOpenChange,
  placement,
  showCloseButton = true,
  blocking = false,
  dragToDismiss = false,
  size,
  className,
}: OverlayPanelProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const portalContainer = useSyncExternalStore(subscribeToPortal, () => document.body, () => null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const dragY = useMotionValue(0);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastTime: number;
    velocity: number;
  } | null>(null);
  const expanded = open ?? internalOpen;
  const canDragToDismiss = placement === "bottom" && dragToDismiss && !blocking;

  const setExpanded = useCallback((next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange, open]);

  const close = useCallback(() => setExpanded(false), [setExpanded]);

  const settleDrag = useCallback((offset: number, velocity: number) => {
    dragStateRef.current = null;
    if (offset > 72 || velocity > 520) {
      close();
      return;
    }
    animate(dragY, 0, { type: "spring", stiffness: 420, damping: 38 });
  }, [close, dragY]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDragToDismiss) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragY.stop();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
    };
  };

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(now - state.lastTime, 1);
    state.velocity = ((event.clientY - state.lastY) / elapsed) * 1000;
    state.lastY = event.clientY;
    state.lastTime = now;
    dragY.set(Math.max(0, event.clientY - state.startY));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    settleDrag(dragY.get(), state.velocity);
  };

  const openPanel = (event: React.MouseEvent<HTMLSpanElement>) => {
    restoreFocusRef.current = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("button, [href], [role='button']")
      : null;
    setExpanded(true);
  };

  useEffect(() => {
    if (!expanded) return;
    dragY.set(0);
    if (!restoreFocusRef.current && document.activeElement instanceof HTMLElement) restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [dragY, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !blocking) {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = focusableElements(panelRef.current);
      if (!focusable.length) {
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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [blocking, close, expanded]);

  const sidePanel = placement !== "bottom";
  const panelSize = typeof size === "number" ? `${size}px` : size;

  return (
    <>
      {trigger ? (
        <span ref={triggerRef} className="inline-flex" onClick={openPanel}>
          {trigger}
        </span>
      ) : null}

      {portalContainer ? createPortal(
        <AnimatePresence onExitComplete={() => restoreFocusRef.current?.focus({ preventScroll: true })}>
          {expanded ? (
            <>
              <motion.button
                key="backdrop"
                type="button"
                aria-label={`Close ${placement === "bottom" ? "bottom sheet" : "app drawer"}`}
                className="fixed inset-0 z-[240] cursor-default bg-black/45 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.1 : motionTokens.duration.standard, ease: motionTokens.ease.enter }}
                onClick={blocking ? undefined : close}
                tabIndex={-1}
              />
              <motion.div
                key="panel"
                data-placement={placement}
                className={[
                  "fixed z-[241] box-border outline-none",
                  placement === "left" && "inset-y-0 left-0 h-dvh max-h-dvh",
                  placement === "right" && "inset-y-0 right-0 h-dvh max-h-dvh",
                  placement === "bottom" && "inset-x-0 bottom-0 mx-auto w-full max-w-[28rem] max-h-[calc(100dvh-16px)]",
                ].filter(Boolean).join(" ")}
                style={sidePanel
                  ? { width: panelSize ?? "min(28rem, calc(100vw - 16px))" }
                  : { height: panelSize, width: "100%" }}
                initial={{ opacity: reduceMotion ? 0 : 1, ...(reduceMotion ? { x: 0, y: 0 } : closedPosition(placement)) }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: reduceMotion ? 0 : 1, ...(reduceMotion ? { x: 0, y: 0 } : closedPosition(placement)) }}
                transition={reduceMotion
                  ? { duration: 0.1 }
                  : { duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
              >
                <motion.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={!title ? ariaLabel ?? (placement === "bottom" ? "Bottom sheet" : "App drawer") : undefined}
                  aria-labelledby={title ? titleId : undefined}
                  aria-describedby={description ? descriptionId : undefined}
                  tabIndex={-1}
                  className={[
                    "box-border flex h-full w-full flex-col overflow-hidden bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-floating)] outline-none",
                    placement === "left" && "rounded-r-[28px]",
                    placement === "right" && "rounded-l-[28px]",
                    placement === "bottom" && "rounded-t-[28px]",
                    className,
                  ].filter(Boolean).join(" ")}
                  style={canDragToDismiss ? { y: dragY } : undefined}
                >
                  {placement === "bottom" && dragToDismiss ? (
                    <div
                      className="grid h-9 shrink-0 touch-none cursor-grab place-items-center active:cursor-grabbing"
                      aria-hidden="true"
                      onPointerDown={startDrag}
                      onPointerMove={updateDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                    >
                      <span className="h-1 w-10 rounded-full bg-[color-mix(in_srgb,var(--text-secondary)_38%,transparent)]" />
                    </div>
                  ) : null}
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-6">
                    {title || description || showCloseButton ? (
                      <header className="mb-5 flex shrink-0 items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {title ? <h2 id={titleId} className="text-lg font-bold leading-6">{title}</h2> : null}
                          {description ? <p id={descriptionId} className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">{description}</p> : null}
                        </div>
                        {showCloseButton ? (
                          <button
                            type="button"
                            aria-label="Close"
                            onClick={close}
                            className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </header>
                    ) : null}
                    <div className="min-h-0 flex-1">
                      {typeof children === "function" ? children({ close }) : children}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        portalContainer,
      ) : null}
    </>
  );
}
