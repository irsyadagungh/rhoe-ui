"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import "../foundation.css";

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  name: string;
  src?: string;
  size?: number;
}

export function Avatar({ name, src, size = 46, className, ...props }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <span {...props} aria-label={props["aria-label"] ?? name} className={["relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--surface-muted)] text-[var(--text)] font-[650]", className].filter(Boolean).join(" ")} style={{ width: size, height: size, fontSize: size * .34, ...props.style }}>
      {src && failedSrc !== src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : initials || "?"}
    </span>
  );
}

export interface AvatarGroupProps extends ComponentPropsWithoutRef<"div"> {
  items: readonly AvatarProps[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ items, max = 4, size = 46, className, ...props }: AvatarGroupProps) {
  const visible = items.slice(0, Math.max(0, max));
  const remaining = items.length - visible.length;
  return (
    <div {...props} className={["inline-flex items-center", className].filter(Boolean).join(" ")}>
      {visible.map((item, index) => <Avatar {...item} size={size} key={`${item.name}-${index}`} className={["ring-2 ring-[var(--surface)]", index ? "-ml-3" : "", item.className].filter(Boolean).join(" ")} />)}
      {remaining > 0 ? <span aria-label={`${remaining} more people`} className="-ml-3 inline-grid shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-[650] text-[var(--text)] ring-2 ring-[var(--surface)]" style={{ width: size, height: size }}>+{remaining}</span> : null}
    </div>
  );
}
