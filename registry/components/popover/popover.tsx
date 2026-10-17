"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Button, type ButtonSize } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

const MotionButton = motion.create(Button);

export type PopoverVariant = "filled" | "bordered";
export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";
export type PopoverTrigger = "button" | "tooltip";

export interface PopoverProps {
  label?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  trigger?: PopoverTrigger;
  variant?: PopoverVariant;
  size?: ButtonSize;
  side?: PopoverSide;
  align?: PopoverAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
}

const sizeClass: Record<ButtonSize, string> = {
  small: "min-h-10",
  medium: "min-h-[46px]",
  large: "min-h-[52px]",
};

const position = {
  top: { surface: "bottom-0 origin-bottom", trigger: "bottom-0", content: "bottom-0", start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" },
  bottom: { surface: "top-0 origin-top", trigger: "top-0", content: "top-0", start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" },
  left: { surface: "right-0 origin-right", trigger: "right-0", content: "right-0", start: "top-0", center: "top-1/2 -translate-y-1/2", end: "bottom-0" },
  right: { surface: "left-0 origin-left", trigger: "left-0", content: "left-0", start: "top-0", center: "top-1/2 -translate-y-1/2", end: "bottom-0" },
} as const;

function findFocusableElement(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    "[data-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
  );
}

export function Popover({
  label,
  icon,
  children,
  ariaLabel,
  trigger = "button",
  variant = "filled",
  size = "medium",
  side = "bottom",
  align = "center",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  contentClassName,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const measuredRef = useRef(false);
  const sizes = useRef({ closedWidth: 46, closedHeight: 46, openWidth: 240, openHeight: 120 });
  const width = useMotionValue(46);
  const height = useMotionValue(46);
  const rootWidth = useMotionValue(46);
  const panelId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const isOpen = open ?? internalOpen;
  const tooltipTrigger = trigger === "tooltip";
  const showIcon = Boolean(icon);
  const showLabel = Boolean(label);
  const triggerSizeClass = tooltipTrigger ? "min-h-8" : sizeClass[size];
  const activePosition = position[side];

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    const sizer = sizerRef.current;
    const content = contentRef.current;
    if (!root || !sizer || !content) return;
    const measure = () => {
      const previous = sizes.current;
      const closedWidth = sizer.offsetWidth;
      const closedHeight = sizer.offsetHeight;
      const openWidth = Math.max(closedWidth, Math.ceil(content.scrollWidth));
      const openHeight = Math.max(closedHeight, Math.ceil(content.scrollHeight));
      sizes.current = { closedWidth, closedHeight, openWidth, openHeight };
      root.style.setProperty("--popover-closed-width", `${closedWidth}px`);
      root.style.setProperty("--popover-closed-height", `${closedHeight}px`);
      if (!measuredRef.current) {
        measuredRef.current = true;
        rootWidth.jump(closedWidth);
        width.jump(isOpen ? openWidth : closedWidth);
        height.jump(isOpen ? openHeight : closedHeight);
      } else {
        const widthChanged = previous.closedWidth !== closedWidth;
        const heightChanged = previous.closedHeight !== closedHeight;
        const openSizeChanged = previous.openWidth !== openWidth || previous.openHeight !== openHeight;
        if (reduceMotion) {
          if (widthChanged) rootWidth.jump(closedWidth);
          if (!isOpen && widthChanged) width.jump(closedWidth);
          if (!isOpen && heightChanged) height.jump(closedHeight);
          if (isOpen && openSizeChanged) {
            width.jump(openWidth);
            height.jump(openHeight);
          }
        } else {
          if (widthChanged) animate(rootWidth, closedWidth, motionTokens.spring.smooth);
          if (!isOpen && widthChanged) animate(width, closedWidth, motionTokens.spring.smooth);
          if (!isOpen && heightChanged) animate(height, closedHeight, motionTokens.spring.smooth);
          if (isOpen && openSizeChanged) {
            animate(width, openWidth, motionTokens.spring.smooth);
            animate(height, openHeight, motionTokens.spring.smooth);
          }
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sizer);
    observer.observe(content);
    return () => observer.disconnect();
  }, [height, isOpen, label, reduceMotion, rootWidth, size, trigger, width]);

  useLayoutEffect(() => {
    const next = sizes.current;
    const targetWidth = isOpen ? next.openWidth : next.closedWidth;
    const targetHeight = isOpen ? next.openHeight : next.closedHeight;
    if (reduceMotion) {
      width.jump(targetWidth);
      height.jump(targetHeight);
      return;
    }
    const widthControl = animate(width, targetWidth, isOpen ? motionTokens.spring.morph : motionTokens.spring.smooth);
    const heightControl = animate(height, targetHeight, isOpen ? motionTokens.spring.morph : motionTokens.spring.smooth);
    return () => {
      widthControl.stop();
      heightControl.stop();
    };
  }, [height, isOpen, reduceMotion, width]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => findFocusableElement(contentRef.current!)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };
  const hiddenTrigger = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: `blur(${motionTokens.blur.subtle}px)` };

  return (
    <motion.div
      ref={rootRef}
      className={["relative z-0 inline-flex min-w-0 data-[open]:z-[100]", triggerSizeClass, className].filter(Boolean).join(" ")}
      data-open={isOpen || undefined}
      data-trigger={trigger}
      style={{ width: rootWidth }}
    >
      <span
        ref={sizerRef}
        className={[
          "invisible absolute inline-flex items-center gap-2 px-5 text-[13px] leading-none font-[650] whitespace-nowrap",
          triggerSizeClass,
          tooltipTrigger && "gap-1.5 px-3 text-xs",
        ].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {showIcon ? <span className={["grid place-items-center", tooltipTrigger ? "[&>svg]:size-[14px]" : "[&>svg]:size-[17px]"].join(" ")}>{icon}</span> : null}
        {showLabel ? <span>{label}</span> : null}
      </span>
      <motion.div
        className={[
          "absolute z-30 min-w-full overflow-hidden rounded-[18px] border text-[var(--text)] shadow-[var(--shadow-resting)] transition-[border-radius] duration-[320ms] ease-[var(--ease-standard)] data-[open]:rounded-[var(--radius-surface)]",
          tooltipTrigger && "rounded-full",
          variant === "filled" ? "border-transparent bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface)]",
          activePosition.surface,
          activePosition[align],
        ].join(" ")}
        data-open={isOpen || undefined}
        style={{ width, height }}
      >
        <MotionButton
          ref={triggerRef}
          type="button"
          variant="text"
          tone="primary"
          size={tooltipTrigger ? "small" : size}
          className={["absolute z-20 flex h-[var(--popover-closed-height)] w-[var(--popover-closed-width)] items-center justify-center gap-2 border-0 bg-transparent px-5 text-[13px] whitespace-nowrap hover:bg-[var(--surface-muted)]", tooltipTrigger && "!min-h-0 gap-1.5 rounded-full px-3 text-xs", activePosition.trigger, activePosition[align]].join(" ")}
          aria-label={!showLabel ? ariaLabel ?? (typeof label === "string" ? label : undefined) : undefined}
          aria-controls={isOpen ? panelId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          inert={isOpen}
          initial={false}
          animate={isOpen ? hiddenTrigger : { opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={reduceMotion ? { duration: 0.01 } : isOpen ? { duration: motionTokens.duration.fast } : { delay: 0.1, duration: motionTokens.duration.standard, ease: motionTokens.ease.enter }}
          onClick={() => setOpen(true)}
        >
          {showIcon ? <span className={["grid shrink-0 place-items-center", tooltipTrigger ? "[&>svg]:size-[14px]" : "[&>svg]:size-[17px]"].join(" ")} aria-hidden="true">{icon}</span> : null}
          {showLabel ? <span>{label}</span> : null}
        </MotionButton>
        <motion.div
          ref={contentRef}
          id={panelId}
          role="dialog"
          aria-label={ariaLabel ?? (typeof label === "string" ? label : "Popover")}
          inert={!isOpen}
          onKeyDown={onPanelKeyDown}
          className={["absolute z-10 inline-block w-max max-w-[min(26rem,calc(100vw-32px))]", activePosition.content, activePosition[align], contentClassName].filter(Boolean).join(" ")}
          initial={false}
          animate={isOpen ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: reduceMotion ? 1 : 0.97, filter: reduceMotion ? "blur(0px)" : `blur(${motionTokens.blur.subtle}px)` }}
          transition={reduceMotion ? { duration: 0.01 } : isOpen ? { delay: 0.1, duration: motionTokens.duration.standard, ease: motionTokens.ease.enter } : { duration: motionTokens.duration.fast }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
