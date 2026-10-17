"use client";

import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom",
  right: "top-1/2 left-full ml-2 -translate-y-1/2 origin-left",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2 origin-top",
  left: "top-1/2 right-full mr-2 -translate-y-1/2 origin-right",
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
  const isOpen = open ?? internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <span className="relative inline-flex">
      <button
        {...props}
        ref={ref}
        type={props.type ?? "button"}
        disabled={disabled}
        className={[
          "inline-grid shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] [webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-[0.48] active:not-disabled:translate-y-px",
          triggerSizeClass[size],
          triggerAppearanceClass[variant],
          className,
        ].filter(Boolean).join(" ")}
        aria-describedby={isOpen ? tooltipId : undefined}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented && !disabled) setOpen(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (!event.defaultPrevented) setOpen(false);
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
            event.currentTarget.blur();
          }
        }}
      >
        <span className="grid place-items-center" aria-hidden="true">{icon}</span>
      </button>
      <AnimatePresence>
        {isOpen ? (
          <span className={["pointer-events-none absolute z-50", panelPositionClass[side]].join(" ")}>
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
      </AnimatePresence>
    </span>
  );
});
