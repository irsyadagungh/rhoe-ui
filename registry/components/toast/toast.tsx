"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type ToastTone = "neutral" | "success" | "warning" | "danger";
export type ToastVariant = "filled" | "bordered";
export type ToastFill = "tinted" | "solid";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastOptions {
  /** Visible notification text. */
  text: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Semantic notification color. */
  tone?: ToastTone;
  /** Filled or outlined surface. */
  variant?: ToastVariant;
  /** Tinted or solid color treatment for filled toasts. */
  fill?: ToastFill;
  /** Time in milliseconds before dismissal. Use 0 to keep it visible. */
  duration?: number;
  /** Stable identifier used to replace an existing toast. */
  id?: string;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Viewport corner or edge center. */
  position?: ToastPosition;
  /** Maximum number of visible notifications. */
  stackLimit?: 1 | 2 | 3;
  /** Default dismissal delay in milliseconds. */
  duration?: number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function subscribeToPortal() {
  return () => undefined;
}

const positionClasses: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "right-4 bottom-4",
};

const tintedClasses: Record<ToastTone, string> = {
  neutral: "border-transparent bg-[var(--surface-muted)] text-[var(--text)]",
  success: "border-transparent bg-[var(--surface-muted)] text-[var(--success-surface-foreground)]",
  warning: "border-transparent bg-[var(--surface-muted)] text-[var(--warning-surface-foreground)]",
  danger: "border-transparent bg-[var(--surface-muted)] text-[var(--danger-surface-foreground)]",
};

const solidClasses: Record<ToastTone, string> = {
  neutral: "border-transparent bg-[var(--primary-hover)] text-[var(--text)]",
  success: "border-transparent bg-[var(--success-surface)] text-[var(--success-surface-foreground)]",
  warning: "border-transparent bg-[var(--warning-surface)] text-[var(--warning-surface-foreground)]",
  danger: "border-transparent bg-[var(--danger-surface)] text-[var(--danger-surface-foreground)]",
};

const borderedClasses: Record<ToastTone, string> = {
  neutral: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
  success: "border border-[var(--success-surface-foreground)] bg-[var(--surface)] text-[var(--success-surface-foreground)]",
  warning: "border border-[var(--warning-surface-foreground)] bg-[var(--surface)] text-[var(--warning-surface-foreground)]",
  danger: "border border-[var(--danger-surface-foreground)] bg-[var(--surface)] text-[var(--danger-surface-foreground)]",
};

const STACK_PEEK = 14;
const STACK_SCALE_STEP = 0.05;
const STACK_GAP = 8;
const TOAST_MIN_HEIGHT = 96;

function ToastCard({
  item,
  index,
  expanded,
  position,
  stackHeight,
}: {
  item: ToastItem;
  index: number;
  expanded: boolean;
  position: ToastPosition;
  stackHeight: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const tone = item.tone ?? "neutral";
  const variant = item.variant ?? "filled";
  const fill = item.fill ?? "tinted";
  const opensDownward = position.startsWith("top");
  const direction = opensDownward ? 1 : -1;
  const offset = expanded
    ? index * (stackHeight + STACK_GAP) * direction
    : index * STACK_PEEK * direction;
  const scale = expanded ? 1 : Math.max(0.85, 1 - index * STACK_SCALE_STEP);
  const fromY = opensDownward ? -stackHeight : stackHeight;
  const appearance = variant === "bordered"
    ? borderedClasses[tone]
    : fill === "solid"
      ? solidClasses[tone]
      : tintedClasses[tone];

  return (
    <motion.li
      layout
      className={[
        "absolute inset-x-0 z-[3] pointer-events-auto flex min-h-24 items-center gap-3 rounded-[18px] border px-6 py-5 text-base leading-[1.5] font-[650] shadow-[var(--shadow-resting)]",
        opensDownward ? "top-0" : "bottom-0",
        appearance,
      ].join(" ")}
      style={{ zIndex: 10 - index }}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      aria-atomic="true"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `translateY(${fromY}px) scale(0.94)` }}
      animate={{ opacity: 1, transform: `translateY(${offset}px) scale(${scale})` }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `translateY(${fromY}px) scale(0.96)` }}
      transition={reduceMotion ? { duration: 0.1 } : motionTokens.spring.morph}
    >
      {item.icon ? <span className="grid shrink-0 place-items-center [&>svg]:size-5" aria-hidden="true">{item.icon}</span> : null}
      <span className="min-w-0 [overflow-wrap:anywhere]">{item.text}</span>
    </motion.li>
  );
}

export function ToastProvider({
  children,
  position = "bottom-right",
  stackLimit = 3,
  duration = 4000,
}: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [stackExpanded, setStackExpanded] = useState(false);
  const portalContainer = useSyncExternalStore(
    subscribeToPortal,
    () => document.body,
    () => null,
  );
  const idRef = useRef(0);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const safeLimit = Math.min(3, Math.max(1, stackLimit));

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    setItems([]);
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = options.id ?? `rhoe-toast-${++idRef.current}`;
    const previousTimer = timersRef.current.get(id);
    if (previousTimer) clearTimeout(previousTimer);

    setItems((current) => [
      ...current.filter((item) => item.id !== id),
      { ...options, id },
    ].slice(-safeLimit));

    const timeout = options.duration ?? duration;
    if (timeout > 0) {
      timersRef.current.set(id, setTimeout(() => dismiss(id), timeout));
    }
    return id;
  }, [dismiss, duration, safeLimit]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const activeIds = new Set(items.map((item) => item.id));
    timersRef.current.forEach((timer, id) => {
      if (activeIds.has(id)) return;
      clearTimeout(timer);
      timersRef.current.delete(id);
    });
  }, [items]);

  const context = useMemo(() => ({ toast, dismiss, dismissAll }), [dismiss, dismissAll, toast]);
  const orderedItems = [...items].reverse();
  const stackHeight = TOAST_MIN_HEIGHT;
  const expandedHeight = stackHeight + Math.max(0, orderedItems.length - 1) * (stackHeight + STACK_GAP);

  return (
    <ToastContext.Provider value={context}>
      {children}
      {portalContainer ? createPortal(
        <motion.ol
          className={[
            "pointer-events-none fixed z-[220] m-0 w-[min(520px,calc(100vw-32px))] max-w-[calc(100vw-32px)] p-0 list-none",
            positionClasses[position],
          ].join(" ")}
          aria-label="Notifications"
          tabIndex={orderedItems.length > 1 ? 0 : -1}
          onClick={() => setStackExpanded((current) => !current)}
          onKeyDown={(event) => { if (event.key === "Escape") setStackExpanded(false); }}
          animate={{ height: orderedItems.length === 0 ? 0 : stackExpanded ? expandedHeight : stackHeight }}
          transition={motionTokens.spring.morph}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setStackExpanded(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setStackExpanded(false);
          }}
          onFocusCapture={() => setStackExpanded(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setStackExpanded(false);
          }}
        >
          <AnimatePresence initial={false}>
            {orderedItems.map((item, index) => (
              <ToastCard
                key={item.id}
                expanded={stackExpanded}
                index={index}
                item={item}
                position={position}
                stackHeight={stackHeight}
              />
            ))}
          </AnimatePresence>
        </motion.ol>,
        portalContainer,
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}
