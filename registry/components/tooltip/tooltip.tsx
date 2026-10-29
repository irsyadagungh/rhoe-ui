"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type TooltipVariant = "filled" | "bordered";
export type TooltipSize = "small" | "medium" | "large";
export type TooltipSide = "top" | "right" | "bottom" | "left";

export interface TooltipProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "content"> {
  /** Accessible name announced for the icon trigger. */
  "aria-label": string;
  /** Content displayed in the tooltip. */
  content: ReactNode;
  /** Visible trigger icon. */
  icon: ReactNode;
  variant?: TooltipVariant;
  size?: TooltipSize;
  side?: TooltipSide;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render the tooltip outside clipping and scrolling containers. */
  portal?: boolean;
}

const triggerSizeClass: Record<TooltipSize, string> = {
  small: "size-8 [&>svg]:size-[14px]",
  medium: "size-[46px] [&>svg]:size-[18px]",
  large: "size-[52px] [&>svg]:size-5",
};

const triggerAppearanceClass: Record<TooltipVariant, string> = {
  filled: "border-transparent bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_82%,var(--text))] hover:text-[var(--text)]",
  bordered: "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_58%,var(--surface))] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
};

const panelPositionClass: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 pb-2 -translate-x-1/2 origin-bottom",
  right: "top-1/2 left-full pl-2 -translate-y-1/2 origin-left",
  bottom: "top-full left-1/2 pt-2 -translate-x-1/2 origin-top",
  left: "top-1/2 right-full pr-2 -translate-y-1/2 origin-right",
};

export const Tooltip = forwardRef<HTMLButtonElement, TooltipProps>(function Tooltip({
  content,
  icon,
  variant = "filled",
  size = "medium",
  side = "top",
  open,
  defaultOpen = false,
  onOpenChange,
  portal = false,
  className,
  disabled,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}, ref) {
  const tooltipId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const isOpen = open ?? internalOpen;

  useEffect(() => {
    if (!portal || !isOpen) return;
    const measure = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setAnchor({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen, portal]);

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <span ref={anchorRef} className="relative inline-flex" onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}>
      <button
        {...props}
        ref={ref}
        id={props.id ?? `${tooltipId}-trigger`}
        type={props.type ?? "button"}
        disabled={disabled}
        className={[
          "inline-grid shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] [webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-[0.48] active:not-disabled:translate-y-px",
          triggerSizeClass[size],
          triggerAppearanceClass[variant],
          className,
        ].filter(Boolean).join(" ")}
        aria-describedby={[props["aria-describedby"], isOpen ? tooltipId : undefined].filter(Boolean).join(" ") || undefined}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented && !disabled) setOpen(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (!event.defaultPrevented && !disabled) setOpen(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <span className="grid place-items-center" aria-hidden="true">{icon}</span>
      </button>
      {portal && typeof document !== "undefined" && anchor ? createPortal(
        <AnimatePresence>
          {isOpen && <span className="pointer-events-none fixed z-[260]" style={{ left: side === "left" ? anchor.left : side === "right" ? anchor.right : (anchor.left + anchor.right) / 2, top: side === "top" ? anchor.top : side === "bottom" ? anchor.bottom : (anchor.top + anchor.bottom) / 2 }}>
            <span className={["absolute", panelPositionClass[side]].join(" ")}>
              <motion.span id={tooltipId} role="tooltip" className="block w-max max-w-64 rounded-[10px] bg-[var(--text)] px-2.5 py-1.5 text-xs leading-[1.35] font-[560] text-[var(--surface)] shadow-[var(--shadow-floating)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: motionTokens.duration.fast }}>
                {content}
              </motion.span>
            </span>
          </span>}
        </AnimatePresence>, document.body,
      ) : !portal && <AnimatePresence>
        {isOpen ? (
          <span className={["absolute z-50", panelPositionClass[side]].join(" ")}>
            <motion.span
              className="block w-max max-w-64 rounded-[10px] bg-[var(--text)] px-2.5 py-1.5 text-xs leading-[1.35] font-[560] text-[var(--surface)] shadow-[var(--shadow-floating)]"
              id={tooltipId}
              role="tooltip"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: side === "top" ? 3 : side === "bottom" ? -3 : 0, x: side === "left" ? 3 : side === "right" ? -3 : 0 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={reduceMotion ? { duration: 0.01 } : motionTokens.spring.smooth}
            >
              {content}
            </motion.span>
          </span>
        ) : null}
      </AnimatePresence>}
    </span>
  );
});
