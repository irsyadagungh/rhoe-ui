"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Avatar } from "../avatar/avatar";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface AvatarInfoItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

interface AvatarInfoBaseProps {
  name: string;
  email: string;
  src?: string;
  side?: "left" | "right";
  items?: readonly AvatarInfoItem[];
  signOutLabel?: string;
  className?: string;
}

export type AvatarInfoProps = AvatarInfoBaseProps & (
  | { onSignOut: () => void; signOutTrigger?: never; signOutDialogOpen?: never }
  | { onSignOut?: never; signOutTrigger: ReactNode; signOutDialogOpen: boolean }
);

export function AvatarInfo({ name, email, src, side = "right", items = [], onSignOut, signOutTrigger, signOutDialogOpen = false, signOutLabel = "Sign out", className }: AvatarInfoProps) {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const highlightId = useId();
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open || signOutDialogOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open, signOutDialogOpen]);

  const transition = reduceMotion ? { duration: 0 } : motionTokens.spring.smooth;
  const actionClass = "relative z-10 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] disabled:opacity-50 [&_svg]:size-4";
  const highlight = (id: string, danger = false) => activeItem === id ? (
    <motion.span aria-hidden="true" layoutId={highlightId} className={`pointer-events-none absolute inset-0 rounded-xl ${danger ? "bg-[var(--danger-surface)]" : "bg-[var(--surface-muted)]"}`} transition={transition} />
  ) : null;

  return (
    <div ref={rootRef} className={["relative inline-block h-[46px] w-[46px]", open ? "z-50" : "z-0", className].filter(Boolean).join(" ")}>
      <motion.div className={`absolute top-0 overflow-hidden rounded-[23px] bg-[var(--surface)] ${open ? "shadow-[0_12px_32px_rgba(0,0,0,0.12)] ring-1 ring-[var(--border)]" : ""} ${side === "left" ? "left-0" : "right-0"}`} initial={false} animate={{ width: open ? 272 : 46 }} transition={transition}>
        <motion.button ref={buttonRef} type="button" aria-expanded={open} aria-controls={panelId} aria-label={`${open ? "Close" : "Open"} account menu for ${name}`} onClick={() => setOpen(!open)} initial={false} animate={{ padding: open ? 8 : 0, height: open ? 62 : 46 }} transition={transition} className="flex w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--focus)]">
          <Avatar name={name} src={src} />
          <motion.span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap pr-4" initial={false} animate={{ opacity: open ? 1 : 0 }} transition={reduceMotion ? { duration: 0 } : { duration: motionTokens.duration.fast, delay: open ? motionTokens.duration.fast : 0 }}>
            <span className="block truncate text-sm font-[650] text-[var(--text)]">{name}</span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">{email}</span>
          </motion.span>
        </motion.button>
        <AnimatePresence initial={false}>
          {open ? <motion.div id={panelId} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { height: { ...motionTokens.spring.smooth, delay: motionTokens.duration.standard }, opacity: { duration: motionTokens.duration.fast, delay: motionTokens.duration.standard } }} className="overflow-hidden">
            <div className="grid gap-1 p-2 pt-3" onPointerLeave={() => setActiveItem(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveItem(null); }}>
              <div aria-hidden="true" className="mb-2 h-px bg-[color-mix(in_srgb,var(--border)_45%,transparent)]" />
              {items.map((item) => <div className="relative" key={item.id} onPointerEnter={() => { if (!item.disabled) setActiveItem(`item:${item.id}`); }} onFocus={() => { if (!item.disabled) setActiveItem(`item:${item.id}`); }}>{highlight(`item:${item.id}`)}<button type="button" className={actionClass} disabled={item.disabled} onClick={() => { setOpen(false); buttonRef.current?.focus(); item.onSelect(); }}>{item.icon}{item.label}</button></div>)}
              <div className="mt-1 border-t border-[color-mix(in_srgb,var(--border)_45%,transparent)] pt-2">
                <div className="relative" onPointerEnter={() => setActiveItem("__sign_out__")} onFocus={() => setActiveItem("__sign_out__")}>
                  {highlight("__sign_out__", true)}
                  {signOutTrigger ? <div className="relative z-10 [&>span]:flex [&>span]:w-full [&>span>button]:w-full">{signOutTrigger}</div> : <button type="button" className={`${actionClass} !text-[var(--danger-surface-foreground)]`} onClick={() => { setOpen(false); buttonRef.current?.focus(); onSignOut?.(); }}><LogOut aria-hidden="true" />{signOutLabel}</button>}
                </div>
              </div>
            </div>
          </motion.div> : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
