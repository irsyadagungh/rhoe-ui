"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { AnimationPlaybackControls, MotionValue, PanInfo } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type CurvedCarouselItem = {
  src: string;
  alt: string;
  title?: string;
  description?: string;
};

export type CurvedCarouselProps = {
  /** Images shown by the carousel. Three or more items gives the intended effect. */
  items?: CurvedCarouselItem[];
  initialIndex?: number;
  className?: string;
};

const defaultItems: CurvedCarouselItem[] = [
  {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85",
    alt: "Aerial view of a winding road through a landscape",
    title: "A quiet distance",
    description: "Northern landscape",
  },
  {
    src: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=85",
    alt: "Forest covered in soft morning fog",
    title: "Morning fog",
    description: "Black Forest, Germany",
  },
  {
    src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=85",
    alt: "Mountain lake beneath an overcast sky",
    title: "Still water",
    description: "Alpine lake",
  },
  {
    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85",
    alt: "A lake beside a forested mountain",
    title: "Between the pines",
    description: "British Columbia, Canada",
  },
  {
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
    alt: "Clouds moving through a mountain valley",
    title: "Above the valley",
    description: "Dolomites, Italy",
  },
];

const ease = "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]";

/** How far side cards turn away. Higher means narrower side cards and a stronger taper. */
const ANGLE = 70;

/** Space between the front card and the side cards, in cqw (percent of the carousel width). */
const GAP = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeIndex(value: number, total: number) {
  if (!total) return 0;
  return ((value % total) + total) % total;
}

/** Returns the copy of an item that is closest to the current unbounded position. */
function loopedOffset(index: number, position: number, total: number) {
  const cycle = Math.round((position - index) / total);
  return index + cycle * total - position;
}

/**
 * p = cardIndex - position. p = 0 is the front card, -1 the card on the left, 1 on the right.
 * Every card has the same size. Side cards pivot around the edge that touches the front card,
 * so that edge stays parallel to the front card and the far edge falls away into the perspective.
 * The index is unbounded; each rendered card chooses its nearest repeated copy on the loop.
 */
function xOf(p: number) {
  const a = Math.min(Math.abs(p), 1);
  const sign = Math.sign(p);
  // 100% of the card width plus the gap, both scaled by how far the card is from the front.
  return `calc(${sign * a * 100}% + ${sign * a * GAP}cqw)`;
}

function opacityOf(p: number) {
  const a = Math.abs(p);
  if (a <= 1) return 1 - 0.35 * a;
  return Math.max(0, 0.65 * (1 - (a - 1) / 0.5));
}

type CardProps = {
  item: CurvedCarouselItem;
  index: number;
  total: number;
  active: boolean;
  position: MotionValue<number>;
  onSelect: (index: number) => void;
  shouldIgnoreClick: () => boolean;
};

function CarouselCard({ item, index, total, active, position, onSelect, shouldIgnoreClick }: CardProps) {
  const p = useTransform(position, (pos) => clamp(loopedOffset(index, pos, total), -3, 3));

  const x = useTransform(p, xOf);
  const rotateY = useTransform(p, (v) => ANGLE * clamp(v, -1, 1));
  const transformOrigin = useTransform(p, (v) => (v < 0 ? "100% 50%" : "0% 50%"));
  const opacity = useTransform(p, opacityOf);
  const zIndex = useTransform(p, (v) => Math.round(100 - Math.abs(v) * 10));
  const visibility = useTransform(p, (v) => (Math.abs(v) >= 1.5 ? "hidden" : "visible"));
  const reflectionOpacity = useTransform(p, (v) => 0.12 + 0.16 * (1 - Math.min(Math.abs(v), 1)));

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${item.title ?? item.alt}`}
      aria-hidden={!active || undefined}
      className="absolute left-[21%] top-0 h-[32.625cqw] w-[58%] will-change-transform"
      style={{ x, rotateY, transformOrigin, opacity, zIndex, visibility }}
    >
      <button
        type="button"
        tabIndex={-1}
        className={`absolute inset-0 block h-full w-full overflow-hidden rounded-[28px] border-0 bg-transparent p-0 outline-none shadow-[0_20px_40px_rgb(0_0_0_/_0.2)] ${active ? "cursor-default" : "cursor-pointer"}`}
        onClick={() => {
          if (!active && !shouldIgnoreClick()) onSelect(index);
        }}
        aria-label={active ? `${item.alt}, active slide` : `Show ${item.alt}`}
        aria-current={active ? "true" : undefined}
      >
        <img
          src={item.src}
          alt={item.alt}
          draggable={false}
          className="pointer-events-none block h-full w-full select-none object-cover"
        />
      </button>

      {/* Reflection: mirrored copy below the card. It shares the card's plane, so it tapers with it. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[calc(100%+0.75rem)] block h-1/4 w-full [mask-image:linear-gradient(to_bottom,black,transparent_82%)] [-webkit-mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
        style={{ opacity: reflectionOpacity }}
      >
        <span className="relative block h-full w-full overflow-hidden">
          <img
            src={item.src}
            alt=""
            draggable={false}
            className="block h-full w-full select-none rounded-[28px] object-cover [transform:scaleY(-1)] [mask-image:linear-gradient(to_bottom,black_0%,black_34%,transparent_56%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_34%,transparent_56%)]"
          />
          <span
            className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_22%,black_48%,transparent_74%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_22%,black_48%,transparent_74%)]"
          >
            <img
              src={item.src}
              alt=""
              draggable={false}
              className="block h-full w-full select-none rounded-[28px] object-cover blur-[2px] [transform:scaleY(-1)_scale(1.02)]"
            />
          </span>
          <span
            className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_52%,black_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_52%,black_78%,transparent_100%)]"
          >
            <img
              src={item.src}
              alt=""
              draggable={false}
              className="block h-full w-full select-none rounded-[28px] object-cover blur-[5px] [transform:scaleY(-1)_scale(1.04)]"
            />
          </span>
        </span>
      </motion.span>
    </motion.div>
  );
}

export function CurvedCarousel({
  items = defaultItems,
  initialIndex = 0,
  className = "",
}: CurvedCarouselProps) {
  const total = items.length;
  const reduceMotion = useReducedMotion() ?? false;

  const startIndex = normalizeIndex(Math.round(initialIndex), total);
  const position = useMotionValue(startIndex);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const [captionDirection, setCaptionDirection] = useState<1 | -1>(1);
  const activePositionRef = useRef(startIndex);
  const rawRef = useRef(startIndex);
  const panStartPositionRef = useRef(startIndex);
  const movedRef = useRef(false);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // How many pixels of dragging equal one card step.
  const pixelsPerCard = useCallback(() => {
    const width = stageRef.current?.offsetWidth ?? 800;
    return Math.max(120, width * 0.3);
  }, []);

  const goTo = useCallback(
    (target: number, velocity = 0) => {
      const next = Math.round(target);
      controlsRef.current?.stop();
      if (reduceMotion) {
        position.set(next);
        return;
      }
      controlsRef.current = animate(position, next, {
        type: "spring",
        stiffness: 240,
        damping: 30,
        mass: 0.9,
        velocity,
      });
    },
    [position, reduceMotion],
  );

  const goToItem = useCallback(
    (itemIndex: number) => {
      const current = position.get();
      const cycle = Math.round((current - itemIndex) / total);
      goTo(itemIndex + cycle * total);
    },
    [goTo, position, total],
  );

  useMotionValueEvent(position, "change", (value) => {
    const nextPosition = Math.round(value);
    if (nextPosition !== activePositionRef.current) {
      setCaptionDirection(nextPosition > activePositionRef.current ? 1 : -1);
      activePositionRef.current = nextPosition;
      setActiveIndex(normalizeIndex(nextPosition, total));
    }
  });

  // Sideways trackpad scroll moves the rail directly, then settles on a card.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      controlsRef.current?.stop();
      rawRef.current = position.get() + event.deltaX / pixelsPerCard();
      position.set(rawRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => goTo(position.get()), 110);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [goTo, pixelsPerCard, position]);

  if (total < 3) return null;

  const activeItem = items[activeIndex];
  const transition = reduceMotion ? { duration: 0 } : motionTokens.spring.smooth;

  function onPanStart() {
    controlsRef.current?.stop();
    rawRef.current = position.get();
    panStartPositionRef.current = Math.round(position.get());
    movedRef.current = false;
  }

  function onPan(_: PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) movedRef.current = true;
    rawRef.current -= info.delta.x / pixelsPerCard();
    position.set(rawRef.current);
  }

  function onPanEnd(_: PointerEvent, info: PanInfo) {
    const velocity = -info.velocity.x / pixelsPerCard(); // cards per second
    const projected = position.get() + velocity * 0.22;
    let target = Math.round(projected);
    const startPosition = panStartPositionRef.current;
    const flicked = Math.abs(info.offset.x) > 40 || Math.abs(velocity) > 1;
    if (target === startPosition && flicked) {
      target = startPosition + (info.offset.x < 0 ? 1 : -1);
    }
    goTo(target, velocity);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const current = Math.round(position.get());
    const keys: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: Math.floor(current / total) * total,
      End: Math.floor(current / total) * total + total - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      goTo(keys[event.key]);
    }
  }

  const captionVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 16 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -d * 16 }),
  };

  return (
    <section
      className={`w-full overflow-hidden ${className}`}
      aria-roledescription="carousel"
      aria-label="Featured images"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* cqw below is relative to this wrapper width. */}
      <div className="mx-auto w-full max-w-6xl [container-type:inline-size]">
        {/*
          Card height = 58cqw * 9/16 = 32.625cqw. Extra rem leaves room for reflection, caption and dots.
          Perspective origin sits at half the card height (16.31cqw) so cards taper evenly top and bottom.
        */}
        <motion.div
          ref={stageRef}
          className="relative h-[calc(32.625cqw+9rem)] w-full cursor-grab select-none touch-pan-y overflow-hidden [perspective-origin:50%_16.31cqw] [perspective:117cqw] active:cursor-grabbing"
          onPointerDown={() => {
            movedRef.current = false;
          }}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
        >
          {items.map((item, index) => (
            <CarouselCard
              key={item.src}
              item={item}
              index={index}
              total={total}
              active={index === activeIndex}
              position={position}
              onSelect={goToItem}
              shouldIgnoreClick={() => movedRef.current}
            />
          ))}

          <AnimatePresence mode="wait" initial={false} custom={captionDirection}>
            <motion.div
              key={activeItem.src}
              custom={captionDirection}
              variants={captionVariants}
              initial={reduceMotion ? false : "enter"}
              animate="center"
              exit={reduceMotion ? undefined : "exit"}
              transition={transition}
              className="pointer-events-none absolute bottom-[3.8rem] left-1/2 z-[200] w-full -translate-x-1/2 px-5 text-center"
              aria-live="polite"
            >
              <p className="m-0 text-lg font-medium tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                {activeItem.title ?? activeItem.alt}
              </p>
              {activeItem.description ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)] sm:text-base">{activeItem.description}</p>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div
            className="absolute bottom-5 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3"
            role="tablist"
            aria-label="Choose image"
          >
            {items.map((item, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={item.src}
                  type="button"
                  role="tab"
                  tabIndex={-1}
                  aria-selected={selected}
                  aria-label={`Show image ${index + 1}: ${item.alt}`}
                  onClick={() => goToItem(index)}
                  className={`h-2.5 rounded-full transition-[width,background-color] duration-[480ms] ${ease} focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4 ${selected ? "w-7 bg-[var(--text)]" : "w-2.5 bg-[var(--text-secondary)] opacity-50 hover:opacity-90"}`}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
