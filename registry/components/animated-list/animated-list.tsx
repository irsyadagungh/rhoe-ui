"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type AnimatedListReplay = "never" | "both" | "up" | "down";
export type AnimatedListItemVariant = "filled" | "bordered" | "transparent";
export type AnimatedListDescriptionPlacement = "below" | "inline";
export type AnimatedListSwipeActionTone = "neutral" | "success" | "warning" | "danger";

export interface AnimatedListSwipeAction {
  /** Visible action label. It can contain custom React content. */
  label: ReactNode;
  /** Runs only after the revealed action is pressed. */
  onAction: () => void;
  /** Optional icon displayed above or beside the label, depending on available space. */
  icon?: ReactNode;
  /** Accessible name when the visible label is not descriptive. */
  ariaLabel?: string;
  /** Semantic color treatment for the action surface. */
  tone?: AnimatedListSwipeActionTone;
  /** Additional styling hook for one action. */
  className?: string;
}

export interface AnimatedListProps<Item>
  extends Omit<HTMLMotionProps<"ul">, "children"> {
  /** Data used with renderItem. */
  items?: readonly Item[];
  /** Direct item content. Each child is wrapped in a semantic list item. */
  children?: ReactNode;
  /** Renders an item when items is supplied. */
  renderItem?: (item: Item, index: number) => ReactNode;
  /** Returns a stable key for data items. */
  getItemKey?: (item: Item, index: number) => string | number;
  /** Whether entries play once or replay while scrolling. */
  replay?: AnimatedListReplay;
  /** Portion of an entry that must enter the viewport before it reveals. */
  amount?: number;
  /** Delay between each item, in seconds. */
  stagger?: number;
  /** Reduces spacing and item padding for compact collections. */
  dense?: boolean;
  /** Accessible label for the list. */
  "aria-label"?: string;
}

export interface AnimatedListItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  variant?: AnimatedListItemVariant;
  leading?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Places the supporting text below the title or inline beside it. */
  descriptionPlacement?: AnimatedListDescriptionPlacement;
  trailing?: ReactNode;
  href?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  /** One optional action on each horizontal swipe direction. */
  swipeActions?: {
    left?: AnimatedListSwipeAction;
    right?: AnimatedListSwipeAction;
  };
}

type ScrollDirection = "up" | "down";

function useScrollDirection() {
  const direction = useRef<ScrollDirection>("down");

  useEffect(() => {
    const positions = new WeakMap<object, number>();

    const getScrollTop = (target: EventTarget | null) => {
      if (target instanceof Element) return target.scrollTop;
      return document.scrollingElement?.scrollTop ?? window.scrollY;
    };

    const updateDirection = (event: Event) => {
      const target = event.target && typeof event.target === "object"
        ? event.target
        : document;
      const nextScrollTop = getScrollTop(event.target);
      const previousScrollTop = positions.get(target) ?? nextScrollTop;

      if (nextScrollTop !== previousScrollTop) {
        direction.current = nextScrollTop > previousScrollTop ? "down" : "up";
      }
      positions.set(target, nextScrollTop);
    };

    const updateWheelDirection = (event: WheelEvent) => {
      if (event.deltaY !== 0) {
        direction.current = event.deltaY > 0 ? "down" : "up";
      }
    };

    document.addEventListener("scroll", updateDirection, { capture: true, passive: true });
    document.addEventListener("wheel", updateWheelDirection, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", updateDirection, true);
      document.removeEventListener("wheel", updateWheelDirection, true);
    };
  }, []);

  return direction;
}

function shouldReplay(replay: AnimatedListReplay, direction: ScrollDirection) {
  return replay === "both" || replay === direction;
}

function AnimatedListEntry({
  children,
  index,
  replay,
  amount,
  stagger,
  getScrollDirection,
}: {
  children: ReactNode;
  index: number;
  replay: AnimatedListReplay;
  amount: number;
  stagger: number;
  getScrollDirection: () => ScrollDirection;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const [entryDirection, setEntryDirection] = useState<ScrollDirection>("down");
  const [revealed, setRevealed] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);

  const hiddenTransform = entryDirection === "up"
    ? "translateY(-25%) scale(0.97)"
    : "translateY(25%) scale(0.97)";
  const delay = replay === "never" ? index * stagger : 0;
  return (
    <motion.li
      ref={ref}
      className="relative z-[1] w-full min-w-0 list-none will-change-[transform,opacity,filter] motion-reduce:will-change-auto"
      layout={!reduceMotion}
      initial={reduceMotion ? false : {
        opacity: 0,
        transform: hiddenTransform,
        filter: `blur(${motionTokens.blur.subtle}px)`,
      }}
      viewport={{ amount, once: replay === "never" }}
      onViewportEnter={() => {
        const direction = getScrollDirection();
        setEntryDirection(direction);
        setCanAnimate(replay === "never" || shouldReplay(replay, direction));
        setRevealed(true);
      }}
      onViewportLeave={() => {
        if (replay !== "never") {
          setCanAnimate(false);
          setRevealed(false);
        }
      }}
      animate={
        reduceMotion || revealed
          ? { opacity: 1, transform: "translateY(0%) scale(1)", filter: "blur(0px)" }
          : { opacity: 0, transform: hiddenTransform, filter: `blur(${motionTokens.blur.subtle}px)` }
      }
      exit={reduceMotion ? { opacity: 0 } : {
        opacity: 0,
        transform: hiddenTransform,
        filter: `blur(${motionTokens.blur.subtle}px)`,
      }}
      transition={
        reduceMotion
          ? { duration: motionTokens.duration.fast }
          : revealed && canAnimate
            ? {
              opacity: {
                duration: motionTokens.duration.considered,
                ease: motionTokens.ease.enter,
                delay,
              },
              transform: {
                duration: motionTokens.duration.reveal,
                ease: motionTokens.ease.enter,
                delay,
              },
              filter: {
                duration: motionTokens.duration.considered,
                ease: motionTokens.ease.enter,
                delay,
              },
              layout: {
                duration: motionTokens.duration.standard,
                ease: motionTokens.ease.standard,
              },
            }
            : revealed
              ? { duration: 0 }
              : { duration: 0.18, ease: motionTokens.ease.enter }
      }
    >
      {children}
    </motion.li>
  );
}

export function AnimatedList<Item>({
  items,
  children,
  renderItem,
  getItemKey,
  replay = "never",
  amount = 0.25,
  stagger = motionTokens.stagger.item,
  dense = false,
  className,
  onPointerMove,
  onPointerLeave,
  ...props
}: AnimatedListProps<Item>) {
  const scrollDirection = useScrollDirection();
  const reduceMotion = useReducedMotion() ?? false;
  const listRef = useRef<HTMLUListElement>(null);
  const hoverTarget = useRef<HTMLElement | null>(null);
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const hoverWidth = useMotionValue(0);
  const hoverHeight = useMotionValue(0);
  const hoverOpacity = useMotionValue(0);
  const content = items
    ? items.map((item, index) => ({
        key: getItemKey?.(item, index) ?? index,
        node: renderItem?.(item, index),
      }))
    : Children.toArray(children).map((node, index) => ({
        key: isValidElement(node) && node.key !== null ? node.key : index,
        node,
      }));
  const safeAmount = Math.min(1, Math.max(0, amount));
  const safeStagger = Math.max(0, stagger);

  const moveHover = (item: HTMLElement) => {
    if (hoverTarget.current === item) return;
    const list = listRef.current;
    if (!list) return;

    const listBounds = list.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    const target = {
      x: itemBounds.left - listBounds.left + list.scrollLeft,
      y: itemBounds.top - listBounds.top + list.scrollTop,
      width: itemBounds.width,
      height: itemBounds.height,
    };

    if (!hoverTarget.current || reduceMotion) {
      hoverX.jump(target.x);
      hoverY.jump(target.y);
      hoverWidth.jump(target.width);
      hoverHeight.jump(target.height);
    } else {
      animate(hoverX, target.x, motionTokens.spring.smooth);
      animate(hoverY, target.y, motionTokens.spring.smooth);
      animate(hoverWidth, target.width, motionTokens.spring.smooth);
      animate(hoverHeight, target.height, motionTokens.spring.smooth);
    }

    hoverTarget.current = item;
    hoverOpacity.set(1);
  };

  const hideHover = () => {
    hoverTarget.current = null;
    animate(hoverOpacity, 0, reduceMotion
      ? { duration: 0 }
      : { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard });
  };

  return (
    <motion.ul
      {...props}
      ref={listRef}
      className={["relative m-0 grid w-full min-w-0 list-none gap-2.5 p-0 data-[dense]:gap-1.5 data-[dense]:[&_.rhoe-list-item]:min-h-12 data-[dense]:[&_.rhoe-list-item]:gap-2 data-[dense]:[&_.rhoe-list-item]:px-2.5 data-[dense]:[&_.rhoe-list-item]:py-2 data-[dense]:[&_.rhoe-list-copy]:gap-px", className].filter(Boolean).join(" ")}
      data-dense={dense || undefined}
      onPointerMove={(event) => {
        const item = (event.target as HTMLElement).closest<HTMLElement>("[data-animated-list-item]");
        if (item) moveHover(item);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        hideHover();
        onPointerLeave?.(event);
      }}
    >
      <motion.span
        className="pointer-events-none absolute z-[2] rounded-[var(--radius-surface)] bg-[color-mix(in_srgb,var(--surface-muted)_24%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
        style={{ x: hoverX, y: hoverY, width: hoverWidth, height: hoverHeight, opacity: hoverOpacity }}
        aria-hidden="true"
      />
      <AnimatePresence initial={false} mode="popLayout">
        {content.map(({ key, node }, index) => (
          <AnimatedListEntry
            key={key}
            index={index}
            replay={replay}
            amount={safeAmount}
            stagger={safeStagger}
            getScrollDirection={() => scrollDirection.current}
          >
            {node}
          </AnimatedListEntry>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

function SwipeableListItem({
  children,
  actions,
  disabled,
}: {
  children: ReactNode;
  actions: NonNullable<AnimatedListItemProps["swipeActions"]>;
  disabled: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const leftWidth = actions.left ? 104 : 0;
  const rightWidth = actions.right ? 104 : 0;
  const x = useMotionValue(-leftWidth);
  const [openSide, setOpenSide] = useState<"left" | "right" | null>(null);
  const leftActionRef = useRef<HTMLButtonElement>(null);
  const rightActionRef = useRef<HTMLButtonElement>(null);

  const settle = (side: "left" | "right" | null, velocity = 0) => {
    const target = side === "left"
      ? 0
      : side === "right"
        ? -(leftWidth + rightWidth)
        : -leftWidth;
    setOpenSide(side);

    if (reduceMotion) {
      x.jump(target);
      return;
    }

    animate(x, target, { ...motionTokens.spring.smooth, velocity });
  };

  const revealForKeyboard = (side: "left" | "right") => {
    if (!actions[side] || disabled) return;
    settle(side);
    requestAnimationFrame(() => {
      (side === "left" ? leftActionRef : rightActionRef).current?.focus();
    });
  };

  const actionClassName = (side: "left" | "right", action: AnimatedListSwipeAction) => [
    "rhoe-swipe-action inline-flex w-[104px] items-center justify-center gap-1.5 border-0 text-center text-xs leading-[1.2] font-bold transition-[border-radius] duration-[var(--duration-standard)] ease-[var(--ease-standard)] focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[-4px]",
    side === "left" ? "col-[1] bg-[var(--primary)] text-[var(--primary-foreground)]" : "col-[3] bg-[var(--primary)] text-[var(--primary-foreground)]",
    action.tone === "success" && "bg-[var(--success)] text-[var(--success-foreground)]",
    action.tone === "warning" && "bg-[var(--warning)] text-[var(--warning-foreground)]",
    action.tone === "danger" && "bg-[var(--danger)] text-[var(--danger-foreground)]",
    action.className,
  ].filter(Boolean).join(" ");

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[var(--radius-surface)] touch-pan-y",
        openSide === "left" && "[&_.rhoe-swipe-left]:rounded-l-[var(--radius-surface)] [&_.rhoe-swipe-content_>:first-child]:rounded-tl-none [&_.rhoe-swipe-content_>:first-child]:rounded-bl-none",
        openSide === "right" && "[&_.rhoe-swipe-right]:rounded-r-[var(--radius-surface)] [&_.rhoe-swipe-content_>:first-child]:rounded-tr-none [&_.rhoe-swipe-content_>:first-child]:rounded-br-none",
      ].filter(Boolean).join(" ")}
      style={{
        "--swipe-left-width": `${leftWidth}px`,
        "--swipe-right-width": `${rightWidth}px`,
      } as React.CSSProperties}
    >
      <motion.div
        className="grid w-[calc(100%+var(--swipe-left-width)+var(--swipe-right-width))] grid-cols-[var(--swipe-left-width)_minmax(0,1fr)_var(--swipe-right-width)] items-stretch touch-pan-y will-change-transform motion-reduce:will-change-auto"
        drag={disabled || reduceMotion ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -(leftWidth + rightWidth), right: 0 }}
        dragElastic={0.12}
        style={{ x }}
        onDragStart={() => setOpenSide(null)}
        onDragEnd={(_, info) => {
          const projectedOffset = x.get() + info.velocity.x * 0.12 + leftWidth;
          if (actions.left && projectedOffset > leftWidth * 0.42) {
            settle("left", info.velocity.x);
          } else if (actions.right && projectedOffset < -rightWidth * 0.42) {
            settle("right", info.velocity.x);
          } else {
            settle(null, info.velocity.x);
          }
        }}
        onKeyDownCapture={(event) => {
          if (!event.altKey) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            revealForKeyboard("left");
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            revealForKeyboard("right");
          }
        }}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (openSide && !target.closest("button")) settle(null);
        }}
      >
        {actions.left ? (
          <button
            ref={leftActionRef}
            type="button"
            className={["rhoe-swipe-left", actionClassName("left", actions.left)].join(" ")}
            tabIndex={openSide === "left" ? 0 : -1}
            aria-hidden={openSide !== "left" || undefined}
            aria-label={actions.left.ariaLabel}
            disabled={disabled}
            onClick={() => {
              actions.left?.onAction();
              settle(null);
            }}
          >
            {actions.left.icon ? <span className="grid place-items-center">{actions.left.icon}</span> : null}
            <span>{actions.left.label}</span>
          </button>
        ) : null}
        <div className="rhoe-swipe-content col-[2] touch-pan-y [&_>:first-child]:transition-[border-radius] [&_>:first-child]:duration-[var(--duration-standard)] [&_>:first-child]:ease-[var(--ease-standard)]">{children}</div>
        {actions.right ? (
          <button
            ref={rightActionRef}
            type="button"
            className={["rhoe-swipe-right", actionClassName("right", actions.right)].join(" ")}
            tabIndex={openSide === "right" ? 0 : -1}
            aria-hidden={openSide !== "right" || undefined}
            aria-label={actions.right.ariaLabel}
            disabled={disabled}
            onClick={() => {
              actions.right?.onAction();
              settle(null);
            }}
          >
            {actions.right.icon ? <span className="grid place-items-center">{actions.right.icon}</span> : null}
            <span>{actions.right.label}</span>
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}

export function AnimatedListItem({
  variant = "bordered",
  leading,
  title,
  description,
  descriptionPlacement = "below",
  trailing,
  href,
  disabled = false,
  onClick,
  swipeActions,
  children,
  className,
  ...props
}: AnimatedListItemProps) {
  const content = children ?? (
    <>
      {leading ? <span className="grid shrink-0 place-items-center text-[var(--text-secondary)]">{leading}</span> : null}
      {title || description ? (
        <span className={descriptionPlacement === "inline" ? "flex min-w-0 items-baseline gap-0 [&_.rhoe-list-title]:min-w-0 [&_.rhoe-list-description]:min-w-0 [&_.rhoe-list-description]:before:mr-2 [&_.rhoe-list-description]:before:text-[var(--border)] [&_.rhoe-list-description]:before:content-['·']" : "rhoe-list-copy grid min-w-0 gap-[3px]"}>
          {title ? <span className="rhoe-list-title overflow-hidden text-sm font-[650] text-ellipsis whitespace-nowrap">{title}</span> : null}
          {description ? <span className="rhoe-list-description overflow-hidden text-xs leading-[1.45] text-ellipsis whitespace-nowrap text-[var(--text-secondary)]">{description}</span> : null}
        </span>
      ) : null}
      {trailing ? <span className="ml-auto grid shrink-0 place-items-center text-[var(--text-secondary)]">{trailing}</span> : null}
    </>
  );
  const contentClassName = [
    "rhoe-list-item flex min-h-16 w-full min-w-0 items-center gap-3 rounded-[var(--radius-surface)] border px-3.5 py-3 text-left no-underline text-[var(--text)]",
    variant === "filled" && "border-transparent bg-[var(--surface-muted)]",
    variant === "bordered" && "border-[var(--border)] bg-[var(--surface)]",
    variant === "transparent" && "border-transparent bg-transparent",
    (href || onClick) && "cursor-pointer transition-[border-color,background-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-[0.48] aria-disabled:cursor-not-allowed aria-disabled:opacity-[0.48] motion-reduce:transition-[border-color,background-color,color]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  let item: ReactNode;

  if (href) {
    const anchorProps = props as Omit<ComponentPropsWithoutRef<"a">, "children" | "className" | "href" | "onClick">;

    item = (
      <a
        {...anchorProps}
        data-animated-list-item=""
        href={disabled ? undefined : href}
        className={contentClassName}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) { event.preventDefault(); return; }
          onClick?.(event);
        }}
      >
        {content}
      </a>
    );
  } else if (onClick) {
    const buttonProps = props as Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "disabled" | "onClick" | "type">;

    item = (
      <button
        {...buttonProps}
        data-animated-list-item=""
        type="button"
        className={contentClassName}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  } else {
    item = <div {...props} data-animated-list-item="" className={contentClassName}>{content}</div>;
  }

  return swipeActions?.left || swipeActions?.right
    ? <SwipeableListItem actions={swipeActions} disabled={disabled}>{item}</SwipeableListItem>
    : item;
}
