"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface TabsItem {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabsItem[];
  value?: string;
  defaultValue?: string;
  variant?: "flat" | "grouped";
  ariaLabel?: string;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
  animatePanelHeight?: boolean;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  items,
  value,
  defaultValue,
  variant = "flat",
  ariaLabel = "Tabs",
  className,
  listClassName,
  panelClassName,
  animatePanelHeight = false,
  onValueChange,
}: TabsProps) {
  const id = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const indicatorReady = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const panelMeasured = useRef(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items[0]?.value ?? "",
  );
  const fallbackValue = items[0]?.value ?? "";
  const requestedValue = value ?? internalValue;
  const activeValue = items.some((item) => item.value === requestedValue)
    ? requestedValue
    : fallbackValue;
  const activeItem = items.find((item) => item.value === activeValue);
  const indicatorX = useMotionValue(0);
  const indicatorY = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);
  const indicatorHeight = useMotionValue(0);
  const indicatorOpacity = useMotionValue(0);
  const panelHeight = useMotionValue<number | string>("auto");

  const select = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    const nextValue = items[nextIndex]?.value;
    if (!nextValue) return;
    select(nextValue);
    tabRefs.current.get(nextValue)?.focus();
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current.get(activeValue);

    if (!list || !tab) {
      indicatorReady.current = false;
      indicatorOpacity.jump(0);
      return;
    }

    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const nextX = tabRect.left - listRect.left;
    const nextY = tabRect.top - listRect.top;
    const transition = reduceMotion
      ? { duration: 0 }
      : motionTokens.spring.morph;

    if (!indicatorReady.current || reduceMotion) {
      indicatorX.jump(nextX);
      indicatorY.jump(nextY);
      indicatorWidth.jump(tabRect.width);
      indicatorHeight.jump(tabRect.height);
    } else {
      animate(indicatorX, nextX, transition);
      animate(indicatorY, nextY, transition);
      animate(indicatorWidth, tabRect.width, transition);
      animate(indicatorHeight, tabRect.height, transition);
    }

    indicatorReady.current = true;
    indicatorOpacity.jump(1);
  }, [activeValue, indicatorHeight, indicatorOpacity, indicatorWidth, indicatorX, indicatorY, items, reduceMotion, variant]);

  useLayoutEffect(() => {
    if (!animatePanelHeight) return;
    const panel = panelRef.current;
    const content = panelContentRef.current;
    if (!panel || !content) return;
    let stopAnimation = () => {};

    const measure = () => {
      const computed = getComputedStyle(panel);
      const verticalChrome =
        parseFloat(computed.paddingTop) +
        parseFloat(computed.paddingBottom) +
        parseFloat(computed.borderTopWidth) +
        parseFloat(computed.borderBottomWidth);
      const nextHeight = content.getBoundingClientRect().height + verticalChrome;
      stopAnimation();

      if (!panelMeasured.current || reduceMotion) {
        panelMeasured.current = true;
        panelHeight.jump(nextHeight);
        return;
      }

      const controls = animate(
        panelHeight,
        nextHeight,
        motionTokens.spring.smooth,
      );
      stopAnimation = () => controls.stop();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => {
      observer.disconnect();
      stopAnimation();
    };
  }, [activeValue, animatePanelHeight, panelHeight, reduceMotion]);

  if (!items.length || !activeItem) return null;

  const activeIndex = items.findIndex((item) => item.value === activeValue);

  return (
    <div className={["min-w-0", className].filter(Boolean).join(" ")}>
      <div
        ref={listRef}
        className={[
          variant === "grouped" ? "relative flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] p-[3px]" : "relative flex max-w-full gap-1 overflow-x-auto border-b border-[var(--border)]",
          listClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        role="tablist"
        aria-label={ariaLabel}
      >
        <motion.span
          className={
            variant === "grouped"
              ? "pointer-events-none absolute top-0 left-0 rounded-[15px] bg-[var(--surface)] shadow-[0_1px_2px_rgb(20_28_23_/_8%)]"
              : "pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-t-full bg-[var(--text)]"
          }
          style={{
            x: indicatorX,
            y: variant === "grouped" ? indicatorY : 0,
            width: indicatorWidth,
            height: variant === "grouped" ? indicatorHeight : undefined,
            opacity: indicatorOpacity,
          }}
          aria-hidden="true"
        />
        {items.map((item, index) => {
          const active = item.value === activeValue;

          return (
            <button
              ref={(element) => {
                if (element) tabRefs.current.set(item.value, element);
                else tabRefs.current.delete(item.value);
              }}
              className={["relative z-[1] inline-flex shrink-0 items-center justify-center gap-[7px] rounded-[15px] border-0 bg-transparent px-3 text-[13px] leading-none font-[560] whitespace-nowrap text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2", variant === "grouped" ? "min-h-10" : "min-h-9", active && "text-[var(--text)]"].filter(Boolean).join(" ")}
              id={`${id}-tab-${index}`}
              role="tab"
              type="button"
              tabIndex={active ? 0 : -1}
              aria-selected={active}
              aria-controls={active ? `${id}-panel-${index}` : undefined}
              onClick={() => select(item.value)}
              onKeyDown={(event) => moveFocus(event, index)}
              key={item.value}
            >
              {item.icon ? (
                <span className="inline-flex shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <motion.div
        ref={panelRef}
        className={[
          "min-w-0 pt-[18px] outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
          animatePanelHeight ? "overflow-hidden" : undefined,
          panelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        id={`${id}-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${activeIndex}`}
        tabIndex={0}
        style={{ height: animatePanelHeight ? panelHeight : undefined }}
      >
        <div ref={panelContentRef}>{activeItem.content}</div>
      </motion.div>
    </div>
  );
}
