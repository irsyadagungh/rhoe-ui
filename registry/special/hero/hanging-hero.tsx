"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

export interface HangingHeroItem {
  id: string;
  content: ReactNode;
  /** Horizontal anchor position, as a percentage of the container. */
  x: number;
  /** Length of the cord in pixels. */
  length: number;
}

export interface HangingHeroProps {
  items: readonly HangingHeroItem[];
  className?: string;
  /** Accessible description of the composition. */
  ariaLabel?: string;
}

type Point = { x: number; y: number; px: number; py: number };
const SEGMENTS = 12;

function Cord({ item, reduced, index }: { item: HangingHeroItem; reduced: boolean; index: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const hitPath = useRef<SVGPathElement>(null);
  const wake = useRef<() => void>(() => {});
  const object = useRef<HTMLDivElement>(null);
  const points = useRef<Point[]>([]);
  const pointer = useRef<{ x: number; y: number; index: number } | null>(null);
  const frame = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const length = Math.max(48, item.length);

  useEffect(() => {
    const gap = length / SEGMENTS;
    const rotation = { angle: 0, angleVelocity: 0, yaw: 0, yawVelocity: 0 };
    // Stable per-item variation avoids hydration mismatches and changes on rerender.
    const seed = Array.from(item.id).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
    const direction = seed % 2 ? 1 : -1;
    const fall = { x: 0, vx: direction * (45 + seed % 55), y: -80, velocity: 0, active: !reduced, started: 0, last: 0 };
    points.current = Array.from({ length: SEGMENTS + 1 }, (_, i) => ({ x: 0, y: i * gap, px: 0, py: i * gap }));
    const render = () => {
      const nodes = points.current;
      const d = `M ${nodes.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
      path.current?.setAttribute("d", d);
      hitPath.current?.setAttribute("d", d);
      const end = nodes[SEGMENTS];
      if (object.current) object.current.style.transform = `translate3d(${end.x}px, ${end.y}px, 0) translateX(-50%) rotate(${rotation.angle}deg) rotateY(${rotation.yaw}deg)`;
    };
    const tick = (now: number) => {
      const nodes = points.current;
      if (fall.active) {
        if (!fall.started) fall.started = now;
        if (now - fall.started < index * 75) { frame.current = requestAnimationFrame(tick); return; }
        const dt = fall.last ? Math.min((now - fall.last) / 1000, 0.04) : 1 / 60;
        fall.last = now;
        fall.velocity += 1900 * dt;
        fall.y += fall.velocity * dt;
        fall.vx *= Math.pow(.55, dt);
        fall.x += fall.vx * dt;
        const limit = Math.sqrt(Math.max(0, length * length - fall.x * fall.x));
        if (fall.y >= limit) {
          fall.y = limit;
          fall.velocity = -fall.velocity * .36;
          if (Math.abs(fall.velocity) < 38) fall.active = false;
        }
        nodes.forEach((node, i) => {
          node.x = fall.x * i / SEGMENTS;
          node.px = node.x - fall.vx / 60 * i / SEGMENTS;
          node.y = Math.max(0, fall.y) * i / SEGMENTS;
          node.py = node.y;
        });
        const end = nodes[SEGMENTS];
        end.y = fall.y;
        end.py = fall.y;
        if (object.current) object.current.style.opacity = "1";
        render();
        frame.current = requestAnimationFrame(tick);
        return;
      }
      for (let i = 1; i <= SEGMENTS; i++) {
        const p = nodes[i];
        const vx = (p.x - p.px) * .985;
        const vy = (p.y - p.py) * .985;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + .18;
      }
      for (let n = 0; n < 8; n++) {
        nodes[0].x = 0; nodes[0].y = 0;
        if (pointer.current) { const p = nodes[pointer.current.index]; p.x = pointer.current.x; p.y = pointer.current.y; }
        for (let i = 1; i <= SEGMENTS; i++) {
          const a = nodes[i - 1], b = nodes[i];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 1;
          const correction = (distance - gap) / distance;
          const factor = i === 1 ? 1 : .5;
          b.x -= dx * correction * factor; b.y -= dy * correction * factor;
          if (i !== 1) { a.x += dx * correction * .5; a.y += dy * correction * .5; }
        }
      }
      const end = nodes[SEGMENTS];
      const previous = nodes[SEGMENTS - 1];
      const tilt = Math.atan2(end.x - previous.x, end.y - previous.y) * -180 / Math.PI;
      const yawTarget = Math.max(-18, Math.min(18, (end.x - end.px) * 2));
      // A heavier item lags behind the cord and gravity pulls it toward level.
      rotation.angleVelocity = (rotation.angleVelocity + (tilt * .22 - rotation.angle) * .045) * .91;
      rotation.angle += rotation.angleVelocity;
      rotation.yawVelocity = (rotation.yawVelocity + (yawTarget - rotation.yaw) * .025) * .94;
      rotation.yaw += rotation.yawVelocity;
      render();
      const moving = nodes.some((p) => Math.abs(p.x) > .1 || Math.abs(p.x - p.px) > .01) || Math.abs(rotation.angle) > .05 || Math.abs(rotation.angleVelocity) > .01 || Math.abs(rotation.yaw) > .05 || Math.abs(rotation.yawVelocity) > .01;
      frame.current = pointer.current || moving ? requestAnimationFrame(tick) : 0;
    };
    wake.current = () => { if (!reduced && !frame.current) frame.current = requestAnimationFrame(tick); };
    render();
    if (!reduced) frame.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame.current); frame.current = 0; };
  }, [index, item.id, length, reduced]);

  const position = (event: PointerEvent) => {
    const bounds = svg.current?.getBoundingClientRect();
    return bounds ? { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top } : null;
  };
  const move = (event: PointerEvent) => {
    if (reduced) return;
    const current = position(event);
    if (!current) return;
    if (pointer.current) { pointer.current.x = current.x; pointer.current.y = current.y; }
    else if (event.pointerType === "mouse" && lastPointer.current) {
      const dx = Math.max(-12, Math.min(12, current.x - lastPointer.current.x));
      const closest = points.current.slice(1).reduce((best, p, index) => Math.hypot(p.x-current.x,p.y-current.y) < best.distance ? { index: index + 1, distance: Math.hypot(p.x-current.x,p.y-current.y) } : best, { index: 1, distance: Infinity });
      if (closest.distance < 25) { points.current[closest.index].px -= dx * .8; wake.current(); }
    }
    lastPointer.current = current;
  };
  const start = (event: PointerEvent, index: number) => {
    if (reduced) return;
    const pos = position(event);
    if (!pos) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { ...pos, index };
    wake.current();
  };
  const release = () => { pointer.current = null; lastPointer.current = null; };

  return <div className="absolute top-0 h-full w-0" style={{ left: `${item.x}%`, perspective: 800 }}>
    <svg ref={svg} aria-hidden="true" className="absolute top-0 -translate-x-1/2 overflow-visible" style={{ width: 100, height: length + 100, touchAction: "pan-y" }} onPointerMove={move} onPointerLeave={() => { lastPointer.current = null; }} onPointerDown={(event) => { const pos = position(event); if (!pos) return; const index = Math.max(1, Math.min(SEGMENTS, Math.round(pos.y / length * SEGMENTS))); start(event, index); }} onPointerUp={release} onPointerCancel={release}>
      <path ref={path} fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-secondary)]" transform="translate(50 0)" />
      <path ref={hitPath} transform="translate(50 0)" stroke="transparent" strokeWidth="36" fill="none" />
    </svg>
    <div ref={object} className="absolute left-0 top-0 origin-top select-none whitespace-nowrap [transform-style:preserve-3d]" style={{ transform: `translate3d(0, ${length}px, 0) translateX(-50%)`, opacity: reduced ? 1 : 0, touchAction: "pan-y" }} onPointerMove={move} onPointerDown={(event) => start(event, SEGMENTS)} onPointerUp={release} onPointerCancel={release}>{item.content}</div>
  </div>;
}

export function HangingHero({ items, className = "", ariaLabel = "Hanging composition" }: HangingHeroProps) {
  const reduced = useReducedMotion() ?? false;
  return <section aria-label={ariaLabel} className={`relative min-h-[650px] w-full overflow-hidden ${className}`} style={{ fontFamily: "var(--font-bebas-neue, 'Bebas Neue'), sans-serif" }}>
    {items.map((item, index) => <Cord key={item.id} item={item} index={index} reduced={reduced} />)}
  </section>;
}
