"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Button } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

const MotionButton = motion.create(Button);

export interface DropdownMenuItem { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean; danger?: boolean; onSelect?: () => void; }
export type DropdownMenuTriggerContent = "text" | "icon-text" | "icon";
export type DropdownMenuVariant = "filled" | "bordered";
export interface DropdownMenuProps { label: ReactNode; ariaLabel?: string; icon?: ReactNode; triggerContent?: DropdownMenuTriggerContent; items: DropdownMenuItem[]; variant?: DropdownMenuVariant; align?: "start" | "center" | "end"; expandedWidth?: number; className?: string; }

export function DropdownMenu({ label, ariaLabel, icon, triggerContent = "icon-text", items, variant = "filled", align = "center", expandedWidth = 240, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openRef = useRef(false);
  const measuredRef = useRef(false);
  const sizes = useRef({ closedWidth: 46, closedHeight: 46, openWidth: expandedWidth, openHeight: 46 });
  const width = useMotionValue(46);
  const height = useMotionValue(46);
  const rootWidth = useMotionValue(46);
  const menuId = useId();
  const reduceMotion = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    const root = rootRef.current, sizer = sizerRef.current, menu = menuRef.current;
    if (!root || !sizer || !menu) return;
    const measure = () => {
      const previousClosedWidth = sizes.current.closedWidth;
      const closedWidth = sizer.offsetWidth;
      const closedHeight = sizer.offsetHeight;
      const openWidth = Math.max(closedWidth, expandedWidth);
      const openHeight = menu.scrollHeight + 2;
      sizes.current = { closedWidth, closedHeight, openWidth, openHeight };
      root.style.setProperty("--dropdown-closed-width", `${closedWidth}px`);
      root.style.setProperty("--dropdown-closed-height", `${closedHeight}px`);
      root.style.setProperty("--dropdown-open-width", `${openWidth}px`);

      if (!measuredRef.current) {
        measuredRef.current = true;
        rootWidth.jump(closedWidth);
        width.jump(closedWidth);
        height.jump(closedHeight);
      } else if (closedWidth !== previousClosedWidth) {
        if (reduceMotion) {
          rootWidth.jump(closedWidth);
          if (!openRef.current) width.jump(closedWidth);
        } else {
          animate(rootWidth, closedWidth, motionTokens.spring.smooth);
          if (!openRef.current) animate(width, closedWidth, motionTokens.spring.smooth);
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sizer); observer.observe(menu);
    return () => observer.disconnect();
  }, [expandedWidth, height, reduceMotion, rootWidth, width]);

  useLayoutEffect(() => {
    openRef.current = open;
    const target = sizes.current;
    const nextWidth = open ? target.openWidth : target.closedWidth;
    const nextHeight = open ? target.openHeight : target.closedHeight;
    if (reduceMotion) { width.jump(nextWidth); height.jump(nextHeight); }
    else {
      const spring = open ? motionTokens.spring.morph : motionTokens.spring.smooth;
      const widthControl = animate(width, nextWidth, spring);
      const heightControl = animate(height, nextHeight, spring);
      return () => { widthControl.stop(); heightControl.stop(); };
    }
  }, [height, open, reduceMotion, width]);

  useLayoutEffect(() => { if (open) itemRefs.current.find(item => item && !item.disabled)?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); return; }
    const enabled = itemRefs.current.filter((item): item is HTMLButtonElement => Boolean(item && !item.disabled));
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") { event.preventDefault(); enabled[(current + 1) % enabled.length]?.focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); enabled[(current - 1 + enabled.length) % enabled.length]?.focus(); }
    if (event.key === "Home") { event.preventDefault(); enabled[0]?.focus(); }
    if (event.key === "End") { event.preventDefault(); enabled.at(-1)?.focus(); }
  };

  const showIcon = triggerContent !== "text" && Boolean(icon);
  const showLabel = triggerContent !== "icon" || !icon;
  const iconOnly = triggerContent === "icon" && Boolean(icon);
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .88, filter: `blur(${motionTokens.blur.subtle}px)` };
  const position = {
    start: { surface: "left-0 origin-top-left", trigger: "left-0", menu: "left-0" },
    center: { surface: "left-1/2 -translate-x-1/2 origin-top", trigger: "left-1/2 -translate-x-1/2", menu: "left-1/2 -translate-x-1/2" },
    end: { surface: "right-0 origin-top-right", trigger: "right-0", menu: "right-0" },
  }[align];

  return <motion.div ref={rootRef} className={["relative z-0 inline-flex h-[46px] min-w-0 data-[open]:z-[100]", className].filter(Boolean).join(" ")} data-open={open || undefined} data-trigger-content={triggerContent} style={{ width: rootWidth }}>
    <span ref={sizerRef} className={["absolute inline-flex min-h-[46px] items-center gap-2 px-5 invisible whitespace-nowrap", iconOnly && "w-[46px] justify-center px-0"].filter(Boolean).join(" ")} aria-hidden="true">
      {showIcon ? icon : null}{showLabel ? <span>{label}</span> : null}
    </span>
    <motion.div className={[
      "absolute top-0 z-30 min-w-full overflow-hidden rounded-[18px] border text-[var(--text)] shadow-[var(--shadow-resting)] transition-[border-radius] duration-[320ms] ease-[var(--ease-standard)] data-[open]:rounded-[var(--radius-surface)]",
      variant === "filled" ? "border-transparent bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface)]",
      position.surface,
    ].join(" ")} data-open={open || undefined} data-variant={variant} style={{ width, height }}>
      <MotionButton ref={triggerRef} type="button" variant="text" tone="primary" size="medium" className={["absolute top-0 flex h-[var(--dropdown-closed-height)] w-[var(--dropdown-closed-width)] items-center justify-center gap-2 border-0 bg-transparent px-[19px] text-[13px] whitespace-nowrap [transform-origin:inherit] hover:bg-[var(--surface-muted)]", position.trigger].join(" ")} aria-expanded={open} aria-controls={menuId} {...(open ? { inert: true } : {})}
        aria-label={iconOnly ? ariaLabel ?? (typeof label === "string" ? label : undefined) : undefined}
        initial={false} animate={open ? hidden : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={reduceMotion ? { duration: .1 } : open ? { duration: .1 } : { duration: .18, ease: motionTokens.ease.enter, delay: .08 }}
        onClick={() => setOpen(true)}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            key={triggerContent}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)", filter: `blur(${motionTokens.blur.subtle}px)` }}
            animate={{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)", filter: `blur(${motionTokens.blur.subtle}px)` }}
            transition={{ duration: reduceMotion ? .08 : .18, ease: motionTokens.ease.enter }}
          >
            {showIcon ? <span className="grid shrink-0 place-items-center [&>svg]:size-[17px]" aria-hidden="true">{icon}</span> : null}{showLabel ? <span>{label}</span> : null}
          </motion.span>
        </AnimatePresence>
      </MotionButton>
      <motion.div ref={menuRef} id={menuId} role="menu" className={["absolute top-0 grid w-[var(--dropdown-open-width)] [transform-origin:inherit]", position.menu].join(" ")} {...(!open ? { inert: true } : {})} aria-label={typeof label === "string" ? label : "Menu"} onKeyDown={onMenuKeyDown}
        initial={false} animate={open ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: reduceMotion ? 1 : .97, filter: reduceMotion ? "blur(0px)" : `blur(${motionTokens.blur.subtle}px)` }}
        transition={reduceMotion ? { duration: .1 } : open ? { duration: .2, ease: motionTokens.ease.enter, delay: .1 } : { duration: .08 }}>
        {items.map((item, index) => <button ref={node => { itemRefs.current[index] = node; }} key={item.value} type="button" role="menuitem" className={[
          "flex min-h-[46px] items-center gap-2.5 border-0 bg-transparent px-6 py-2.5 text-left text-[13px] text-[var(--text)] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--focus)] first:rounded-t-[calc(var(--radius-surface)-1px)] last:rounded-b-[calc(var(--radius-surface)-1px)] only:rounded-[calc(var(--radius-surface)-1px)] disabled:cursor-not-allowed disabled:opacity-45",
          variant === "filled" ? "hover:bg-[var(--surface)]" : "hover:bg-[var(--surface-muted)]",
          item.danger && "text-[var(--danger-surface-foreground)] hover:bg-[var(--danger-surface)]",
        ].filter(Boolean).join(" ")} disabled={item.disabled}
          onClick={() => { item.onSelect?.(); setOpen(false); }}>
          {item.icon ? <span className="grid shrink-0 place-items-center [&>svg]:size-[17px]" aria-hidden="true">{item.icon}</span> : null}<span>{item.label}</span>
        </button>)}
      </motion.div>
    </motion.div>
  </motion.div>;
}
