"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Button } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

const MotionButton = motion.create(Button);

export interface DropdownMenuItem { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean; danger?: boolean; onSelect?: () => void; }
export type DropdownMenuTriggerContent = "text" | "icon-text" | "icon";
export type DropdownMenuVariant = "filled" | "bordered";
export interface DropdownMenuProps { label: ReactNode; ariaLabel?: string; icon?: ReactNode; triggerContent?: DropdownMenuTriggerContent; items: DropdownMenuItem[]; variant?: DropdownMenuVariant; align?: "start" | "center" | "end"; expandedWidth?: number; className?: string; }

type Sizes = { closedWidth: number; closedHeight: number; openWidth: number; openHeight: number };

// These CSS variables are used by the trigger and menu. Since the surface renders through a portal
// (no longer a child of the root), the variables must also be set on the portal anchor element.
function applyVars(el: HTMLElement | null, s: Sizes) {
  if (!el) return;
  el.style.setProperty("--dropdown-closed-width", `${s.closedWidth}px`);
  el.style.setProperty("--dropdown-closed-height", `${s.closedHeight}px`);
  el.style.setProperty("--dropdown-open-width", `${s.openWidth}px`);
}

export function DropdownMenu({ label, ariaLabel, icon, triggerContent = "icon-text", items, variant = "filled", align = "center", expandedWidth = 240, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  // present: surface is in the portal (true while open and during the closing animation)
  const [present, setPresent] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openRef = useRef(false);
  const measuredRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const sizes = useRef<Sizes>({ closedWidth: 46, closedHeight: 46, openWidth: expandedWidth, openHeight: 46 });
  const width = useMotionValue(46);
  const height = useMotionValue(46);
  const rootWidth = useMotionValue(46);
  const menuId = useId();
  const reduceMotion = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    const root = rootRef.current, sizer = sizerRef.current;
    if (!root || !sizer) return;
    const measure = () => {
      const previousClosedWidth = sizes.current.closedWidth;
      const closedWidth = sizer.offsetWidth;
      const closedHeight = sizer.offsetHeight;
      const openWidth = Math.max(closedWidth, expandedWidth);
      sizes.current = { ...sizes.current, closedWidth, closedHeight, openWidth };
      applyVars(root, sizes.current);
      applyVars(anchorRef.current, sizes.current);

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
    observer.observe(sizer);
    return () => observer.disconnect();
  }, [expandedWidth, height, reduceMotion, rootWidth, width]);

  // Sync the anchor (position: fixed) with the root position while the portal is active.
  // Uses a rAF loop to stay accurate during any container scroll, resize, or layout shift.
  useLayoutEffect(() => {
    if (!present) return;
    const anchor = anchorRef.current, root = rootRef.current;
    if (!anchor || !root) return;
    applyVars(anchor, sizes.current);
    let frame = 0, top = Number.NaN, left = Number.NaN;
    const sync = () => {
      const rect = root.getBoundingClientRect();
      if (rect.top !== top || rect.left !== left) {
        top = rect.top; left = rect.left;
        anchor.style.top = `${top}px`;
        anchor.style.left = `${left}px`;
      }
      frame = requestAnimationFrame(sync);
    };
    sync();
    return () => cancelAnimationFrame(frame);
  }, [present]);

  useLayoutEffect(() => {
    openRef.current = open;
    if (!present) return;
    if (open && menuRef.current) sizes.current.openHeight = menuRef.current.scrollHeight + 2;
    const target = sizes.current;
    const nextWidth = open ? target.openWidth : target.closedWidth;
    const nextHeight = open ? target.openHeight : target.closedHeight;
    if (reduceMotion) {
      width.jump(nextWidth); height.jump(nextHeight);
      if (!open) setPresent(false);
      return;
    }
    const spring = open ? motionTokens.spring.morph : motionTokens.spring.smooth;
    const widthControl = animate(width, nextWidth, spring);
    const heightControl = animate(height, nextHeight, spring);
    if (!open) {
      Promise.all([widthControl, heightControl]).then(() => { if (!openRef.current) setPresent(false); });
    }
    return () => { widthControl.stop(); heightControl.stop(); };
  }, [height, open, present, reduceMotion, width]);

  useLayoutEffect(() => { if (open) itemRefs.current.find(item => item && !item.disabled)?.focus({ preventScroll: true }); }, [open]);

  // Setelah portal dilepas, kembalikan fokus ke trigger inline.
  useEffect(() => {
    if (!present && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [present]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); restoreFocusRef.current = true; setOpen(false); return; }
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
  const triggerHidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .88, filter: `blur(${motionTokens.blur.subtle}px)` };
  const triggerShown = { opacity: 1, scale: 1, filter: "blur(0px)" };
  const menuHidden = { opacity: 0, scale: reduceMotion ? 1 : .97, filter: reduceMotion ? "blur(0px)" : `blur(${motionTokens.blur.subtle}px)` };
  const menuShown = { opacity: 1, scale: 1, filter: "blur(0px)" };
  const position = {
    start: { surface: "left-0 origin-top-left", trigger: "left-0", menu: "left-0" },
    center: { surface: "left-1/2 -translate-x-1/2 origin-top", trigger: "left-1/2 -translate-x-1/2", menu: "left-1/2 -translate-x-1/2" },
    end: { surface: "right-0 origin-top-right", trigger: "right-0", menu: "right-0" },
  }[align];

  const openMenu = () => { setPresent(true); setOpen(true); };

  const renderSurface = (inPortal: boolean) => <motion.div className={[
    "absolute top-0 z-30 min-w-full overflow-hidden rounded-[18px] border text-[var(--text)] shadow-[var(--shadow-resting)] transition-[border-radius] duration-[320ms] ease-[var(--ease-standard)] data-[open]:rounded-[var(--radius-surface)] data-[open]:border-[color-mix(in_srgb,var(--border)_75%,transparent)] data-[open]:shadow-[var(--shadow-floating)]",
    variant === "filled" ? "border-transparent bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface)]",
    inPortal && "pointer-events-auto",
    position.surface,
  ].filter(Boolean).join(" ")} data-open={open || undefined} data-variant={variant} style={{ width, height }}>
    <MotionButton ref={triggerRef} type="button" variant="text" tone="primary" size="medium" className={["absolute top-0 flex h-[var(--dropdown-closed-height)] w-[var(--dropdown-closed-width)] items-center justify-center gap-2 border-0 bg-transparent px-[19px] text-[13px] whitespace-nowrap [transform-origin:inherit] hover:bg-[var(--surface-muted)]", position.trigger].join(" ")} aria-expanded={open} aria-controls={menuId} {...(open ? { inert: true } : {})}
      aria-label={iconOnly ? ariaLabel ?? (typeof label === "string" ? label : undefined) : undefined}
      initial={inPortal ? triggerShown : false} animate={open ? triggerHidden : triggerShown}
      transition={reduceMotion ? { duration: .1 } : open ? { duration: .1 } : { duration: .18, ease: motionTokens.ease.enter, delay: .08 }}
      onClick={openMenu}>
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
    {inPortal ? <motion.div ref={menuRef} id={menuId} role="menu" className={["absolute top-0 grid w-[var(--dropdown-open-width)] [transform-origin:inherit]", position.menu].join(" ")} {...(!open ? { inert: true } : {})} aria-label={typeof label === "string" ? label : "Menu"} onKeyDown={onMenuKeyDown}
      initial={menuHidden} animate={open ? menuShown : menuHidden}
      transition={reduceMotion ? { duration: .1 } : open ? { duration: .2, ease: motionTokens.ease.enter, delay: .1 } : { duration: .08 }}>
      {items.map((item, index) => <button ref={node => { itemRefs.current[index] = node; }} key={item.value} type="button" role="menuitem" className={[
        "flex min-h-[46px] items-center gap-2.5 border-0 bg-transparent px-6 py-2.5 text-left text-[13px] text-[var(--text)] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--focus)] first:rounded-t-[calc(var(--radius-surface)-1px)] last:rounded-b-[calc(var(--radius-surface)-1px)] only:rounded-[calc(var(--radius-surface)-1px)] disabled:cursor-not-allowed disabled:opacity-45",
        variant === "filled" ? "hover:bg-[var(--surface)]" : "hover:bg-[var(--surface-muted)]",
        item.danger && "text-[var(--danger-surface-foreground)] hover:bg-[var(--danger-surface)]",
      ].filter(Boolean).join(" ")} disabled={item.disabled}
        onClick={() => { item.onSelect?.(); restoreFocusRef.current = true; setOpen(false); }}>
        {item.icon ? <span className="grid shrink-0 place-items-center [&>svg]:size-[17px]" aria-hidden="true">{item.icon}</span> : null}<span>{item.label}</span>
      </button>)}
    </motion.div> : null}
  </motion.div>;

  return <motion.div ref={rootRef} className={["relative z-0 inline-flex h-[46px] min-w-0", className].filter(Boolean).join(" ")} data-open={open || undefined} data-trigger-content={triggerContent} style={{ width: rootWidth }}>
    <span ref={sizerRef} className={["absolute inline-flex min-h-[46px] items-center gap-2 px-5 invisible whitespace-nowrap", iconOnly && "w-[46px] justify-center px-0"].filter(Boolean).join(" ")} aria-hidden="true">
      {showIcon ? icon : null}{showLabel ? <span>{label}</span> : null}
    </span>
    {present ? null : renderSurface(false)}
    {present ? createPortal(
      <motion.div ref={anchorRef} className="pointer-events-none fixed left-0 top-0 z-[100] h-[46px]" style={{ width: rootWidth }}>
        {renderSurface(true)}
      </motion.div>,
      document.body,
    ) : null}
  </motion.div>;
}