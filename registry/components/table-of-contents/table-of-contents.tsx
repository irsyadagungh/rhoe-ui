"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface TableOfContentsItem {
  id: string;
  label: string;
}

export interface TableOfContentsProps {
  items: TableOfContentsItem[];
  title?: string;
  ariaLabel?: string;
}

export function TableOfContents({
  items,
  title = "On this page",
  ariaLabel = "On this page",
}: TableOfContentsProps) {
  const [observedActiveId, setObservedActiveId] = useState(items[0]?.id ?? "");
  const activeId = items.some((item) => item.id === observedActiveId)
    ? observedActiveId
    : (items[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const railReady = useRef(false);
  const clickedIdRef = useRef<string>("");
  const clickLockTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduceMotion = useReducedMotion() ?? false;
  const railY = useMotionValue(0);
  const railHeight = useMotionValue(0);
  const railOpacity = useMotionValue(0);

  const selectItem = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    setObservedActiveId(id);

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const section = document.getElementById(id);
    if (!section) return;

    event.preventDefault();
    clickedIdRef.current = id;
    clearTimeout(clickLockTimerRef.current);
    clickLockTimerRef.current = setTimeout(() => {
      clickedIdRef.current = "";
    }, 2000);
    window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
    section.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (!items.length) return;
    let frame = 0;
    let releaseFrame = 0;

    const update = () => {
      if (clickedIdRef.current) {
        setObservedActiveId(clickedIdRef.current);
        return;
      }

      let current = items[0]?.id ?? "";

      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= 128) {
          current = item.id;
        }
      }

      const pageHeight = document.documentElement.scrollHeight;
      const reachedPageEnd =
        pageHeight > window.innerHeight + 2 &&
        window.innerHeight + window.scrollY >= pageHeight - 2;
      if (reachedPageEnd) current = items.at(-1)?.id ?? current;

      setObservedActiveId(current);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const releaseClickLock = () => {
      clearTimeout(clickLockTimerRef.current);
      cancelAnimationFrame(releaseFrame);
      releaseFrame = requestAnimationFrame(() => {
        clickedIdRef.current = "";
      });
    };

    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", releaseClickLock);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(releaseFrame);
      clearTimeout(clickLockTimerRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", releaseClickLock);
    };
  }, [items]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const item = itemRefs.current.get(activeId);

    if (!list || !item) {
      railReady.current = false;
      railOpacity.jump(0);
      return;
    }

    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const nextY = itemRect.top - listRect.top;
    const transition = reduceMotion
      ? { duration: 0 }
      : motionTokens.spring.morph;

    if (!railReady.current || reduceMotion) {
      railY.jump(nextY);
      railHeight.jump(itemRect.height);
    } else {
      animate(railY, nextY, transition);
      animate(railHeight, itemRect.height, transition);
    }

    railReady.current = true;
    railOpacity.jump(1);
  }, [activeId, items, railHeight, railOpacity, railY, reduceMotion]);

  if (!items.length) return null;

  return (
    <nav className="min-w-0" aria-label={ariaLabel}>
      <p className="text-xs font-[650] text-[var(--text)]">{title}</p>
      <div className="relative mt-3.5">
        <span className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-[var(--border)]" aria-hidden="true" />
        <motion.span
          className="pointer-events-none absolute top-0 left-0 z-[1] w-0.5 rounded-full bg-[var(--text)]"
          style={{ y: railY, height: railHeight, opacity: railOpacity }}
          aria-hidden="true"
        />
        <ul className="m-0 grid list-none gap-[3px] p-0 pl-[13px]" ref={listRef}>
          {items.map((item) => (
            <li
              ref={(element) => {
                if (element) itemRefs.current.set(item.id, element);
                else itemRefs.current.delete(item.id);
              }}
              key={item.id}
            >
              <a
                className={
                  activeId === item.id ? "block rounded-md px-0.5 py-[5px] text-xs leading-[1.35] no-underline text-[var(--text)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2" : "block rounded-md px-0.5 py-[5px] text-xs leading-[1.35] no-underline text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
                }
                href={`#${item.id}`}
                aria-current={activeId === item.id ? "location" : undefined}
                onClick={(event) => selectItem(event, item.id)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
