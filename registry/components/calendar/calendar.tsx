"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import { MorphingText } from "../morphing-text/morphing-text";
import "../foundation.css";

export type CalendarVariant = "compact" | "full";
export type CalendarView = "days" | "months" | "years";

export interface CalendarProps {
  variant?: CalendarVariant;
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  locale?: string;
  weekStartsOn?: 0 | 1;
  ariaLabel?: string;
  className?: string;
}

type Rect = { x: number; y: number; w: number; h: number };

type Zoom =
  /** Plain crossfade, used for prev/next navigation. */
  | { kind: "fade" }
  /** Zoom around the center of the clicked cell (compact months, years). */
  | { kind: "origin"; dir: 1 | -1; origin: string }
  /** Shared element zoom between a mini calendar and the days grid (full variant). */
  | { kind: "rect"; dir: 1 | -1; rect: Rect; width: number };

const FADE: Zoom = { kind: "fade" };
const LEVEL: Record<CalendarView, number> = { days: 0, months: 1, years: 2 };
const ZOOM_EASE = [0.32, 0.72, 0, 1] as const;
const ZOOM_IN_FROM = 0.5;
const ZOOM_OUT_TO = 1.8;

/** Layout constants of the full months grid. They must match the classes in renderMonths. */
const MINI_GAP = 12; // gap-3
const MINI_PAD = 12; // p-3
const MINI_LABEL = 28; // text-sm line height (20) + mb-2 (8)
const MINI_HEADER_RATIO = 25; // weekday row height = grid width / 25

function localDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function moveDateByMonth(date: Date, amount: number) {
  const destination = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(destination.getFullYear(), destination.getMonth() + 1, 0).getDate();
  return new Date(destination.getFullYear(), destination.getMonth(), Math.min(date.getDate(), lastDay));
}

function isSameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthDays(month: Date, weekStartsOn: 0 | 1) {
  const start = firstOfMonth(month);
  const offset = (start.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => addDays(start, index - offset));
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Number of columns of the months grid. Mirrors the Tailwind breakpoints used in renderMonths. */
function monthColumns(variant: CalendarVariant) {
  if (variant === "compact" || typeof window === "undefined") return 3;
  if (window.matchMedia("(min-width: 1024px)").matches) return 4;
  if (window.matchMedia("(min-width: 640px)").matches) return 3;
  return 2;
}

/** Center of a cell in a grid, as a CSS transform-origin. */
function gridOrigin(index: number, columns: number, count = 12) {
  const rows = Math.ceil(count / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return `${((column + 0.5) / columns) * 100}% ${((row + 0.5) / rows) * 100}%`;
}

/** Position of a mini calendar's grid inside the page, computed from the months grid layout. */
function miniRect(month: number, width: number): Rect {
  const columns = monthColumns("full");
  const cardWidth = (width - (columns - 1) * MINI_GAP) / columns;
  const gridWidth = cardWidth - MINI_PAD * 2;
  const gridHeight = gridWidth / MINI_HEADER_RATIO + (gridWidth / 7) * 6;
  const cardHeight = MINI_PAD * 2 + MINI_LABEL + gridHeight;
  const column = month % columns;
  const row = Math.floor(month / columns);
  return {
    x: column * (cardWidth + MINI_GAP) + MINI_PAD,
    y: row * (cardHeight + MINI_GAP) + MINI_PAD + MINI_LABEL,
    w: gridWidth,
    h: gridHeight,
  };
}

/** Reports the height of the visible page so the wrapper can animate its own height. */
function MeasuredPage({ onHeight, children }: { onHeight: (height: number) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const present = useIsPresent();

  useEffect(() => {
    const element = ref.current;
    if (!element || !present) return;
    const report = () => onHeight(element.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [present, onHeight]);

  return <div ref={ref}>{children}</div>;
}

export function Calendar({
  variant = "compact",
  value,
  defaultValue,
  onValueChange,
  locale = "en-US",
  weekStartsOn = 0,
  ariaLabel = "Calendar",
  className,
}: CalendarProps) {
  const today = useMemo(() => localDate(new Date()), []);
  const initialDate = localDate(value ?? defaultValue ?? today);
  const [internalValue, setInternalValue] = useState(initialDate);
  const selectedDate = value ? localDate(value) : internalValue;
  const [cursorMonth, setCursorMonth] = useState(firstOfMonth(initialDate));
  const [focusedDate, setFocusedDate] = useState(initialDate);
  const [controlledStamp, setControlledStamp] = useState(value?.getTime());
  const [view, setView] = useState<CalendarView>("days");
  const [zoom, setZoom] = useState<Zoom>(FADE);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const calendarId = useId();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [dayHoverVisible, setDayHoverVisible] = useState(false);

  if (value && value.getTime() !== controlledStamp) {
    const next = localDate(value);
    setControlledStamp(value.getTime());
    setCursorMonth(firstOfMonth(next));
    setFocusedDate(next);
    setZoom(FADE);
  }

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }),
    [locale],
  );
  const selectedFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );
  const accessibleDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale],
  );
  const monthLabels = useMemo(
    () => Array.from({ length: 12 }, (_, month) => monthFormatter.format(new Date(2024, month, 1))),
    [monthFormatter],
  );
  const weekdays = useMemo(() => {
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(addDays(sunday, index + weekStartsOn)));
  }, [weekdayFormatter, weekStartsOn]);

  const yearPageStart = Math.floor(cursorMonth.getFullYear() / 12) * 12;

  /**
   * Switches view. `anchor` is the index of the clicked cell (month 0 to 11, or the year offset
   * inside the visible 12 year page). `miniGrid` is the mini calendar element that was clicked,
   * when there is one, so the zoom can start from its exact measured position.
   */
  const changeView = (nextView: CalendarView, anchor?: number, miniGrid?: Element | null) => {
    setDayHoverVisible(false);
    if (nextView === view) {
      setZoom(FADE);
      return;
    }
    const dir: 1 | -1 = LEVEL[nextView] < LEVEL[view] ? 1 : -1;

    const wrapper = wrapperRef.current;
    const pageWidth = wrapper ? wrapper.clientWidth - 8 : 0; // wrapper has 4px padding per side
    const monthsDaysSwap =
      variant === "full" &&
      pageWidth > 0 &&
      ((view === "months" && nextView === "days") || (view === "days" && nextView === "months"));

    if (monthsDaysSwap && wrapper) {
      let rect: Rect;
      if (miniGrid) {
        const wrapperBox = wrapper.getBoundingClientRect();
        const box = miniGrid.getBoundingClientRect();
        rect = { x: box.left - wrapperBox.left - 4, y: box.top - wrapperBox.top - 4, w: box.width, h: box.height };
      } else {
        rect = miniRect(anchor ?? cursorMonth.getMonth(), pageWidth);
      }
      setZoom({ kind: "rect", dir, rect, width: pageWidth });
      setView(nextView);
      return;
    }

    const involvesYears = nextView === "years" || view === "years";
    const index = anchor ?? (involvesYears ? cursorMonth.getFullYear() - yearPageStart : cursorMonth.getMonth());
    const origin = gridOrigin(index, involvesYears ? 3 : monthColumns(variant));
    setZoom({ kind: "origin", dir, origin });
    setView(nextView);
  };

  const selectDate = (date: Date) => {
    const next = localDate(date);
    setDayHoverVisible(false);
    if (value === undefined) setInternalValue(next);
    setCursorMonth(firstOfMonth(next));
    setFocusedDate(next);
    setZoom(FADE);
    onValueChange?.(next);
  };

  const moveDayFocus = (date: Date, origin: HTMLButtonElement) => {
    setFocusedDate(date);
    setCursorMonth(firstOfMonth(date));
    setZoom(FADE);
    const calendar = origin.closest<HTMLElement>("[data-sya-calendar]");
    requestAnimationFrame(() => {
      calendar?.querySelector<HTMLButtonElement>(`[data-date-key="${dateKey(date)}"]`)?.focus();
    });
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date | undefined;

    if (event.key === "ArrowLeft") next = addDays(date, -1);
    if (event.key === "ArrowRight") next = addDays(date, 1);
    if (event.key === "ArrowUp") next = addDays(date, -7);
    if (event.key === "ArrowDown") next = addDays(date, 7);
    if (event.key === "PageUp") next = moveDateByMonth(date, -1);
    if (event.key === "PageDown") next = moveDateByMonth(date, 1);
    if (event.key === "Home") next = addDays(date, -((date.getDay() - weekStartsOn + 7) % 7));
    if (event.key === "End") next = addDays(date, 6 - ((date.getDay() - weekStartsOn + 7) % 7));

    if (!next) return;
    event.preventDefault();
    moveDayFocus(next, event.currentTarget);
  };

  const navigate = (direction: -1 | 1) => {
    setDayHoverVisible(false);
    setZoom(FADE);
    if (view === "days") {
      const next = addMonths(cursorMonth, direction);
      setCursorMonth(next);
      setFocusedDate(next);
      return;
    }
    if (view === "months") {
      setCursorMonth(new Date(cursorMonth.getFullYear() + direction, cursorMonth.getMonth(), 1));
      return;
    }
    setCursorMonth(new Date(cursorMonth.getFullYear() + direction * 12, cursorMonth.getMonth(), 1));
  };

  const pageKey = view === "days"
    ? `${view}-${cursorMonth.getFullYear()}-${cursorMonth.getMonth()}`
    : view === "months"
      ? `${view}-${cursorMonth.getFullYear()}`
      : `${view}-${yearPageStart}`;

  // Wrapper padding is 4px on each side (see className below), so add 8px to the measured page.
  const handleHeight = useCallback((measured: number) => setHeight(measured + 8), []);

  const zoomTransition = reduceMotion ? { duration: 0 } : { duration: 0.6, ease: ZOOM_EASE };
  const heightTransition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: ZOOM_EASE };

  /** Pose of a page that is "zoomed away": either shrunk into a mini calendar or blown up around it. */
  const zoomedPose = (z: Zoom, role: "enter" | "exit") => {
    if (reduceMotion || z.kind === "fade") return { opacity: 0 };

    if (z.kind === "origin") {
      // Zooming in (dir 1): the new page grows from small, the old page grows away.
      const growing = (z.dir === 1) === (role === "exit");
      return { opacity: 0, scale: growing ? ZOOM_OUT_TO : ZOOM_IN_FROM, transformOrigin: z.origin };
    }

    // Shared element zoom. "small" pose: the whole days page shrunk into the mini calendar's rect.
    // "big" pose: the whole months page enlarged so the mini calendar fills the days page.
    const small = { opacity: 0, x: z.rect.x, y: z.rect.y, scale: z.rect.w / z.width, transformOrigin: "0% 0%" };
    const k = z.width / z.rect.w;
    const big = { opacity: 0, x: -z.rect.x * k, y: -z.rect.y * k, scale: k, transformOrigin: "0% 0%" };

    // dir 1 (months to days): entering page is the days page (small), exiting page is months (big).
    // dir -1 (days to months): entering page is months (big), exiting page is days (small).
    const isDaysPage = (z.dir === 1) === (role === "enter");
    return isDaysPage ? small : big;
  };

  const pageVariants = {
    enter: (z: Zoom) => zoomedPose(z, "enter"),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : {
            x: zoomTransition,
            y: zoomTransition,
            scale: zoomTransition,
            opacity: { duration: 0.35, delay: 0.1, ease: "easeOut" as const },
          },
    },
    exit: (z: Zoom) => ({
      ...zoomedPose(z, "exit"),
      transition: reduceMotion
        ? { duration: 0 }
        : {
            x: zoomTransition,
            y: zoomTransition,
            scale: zoomTransition,
            opacity: { duration: 0.3, delay: 0.04, ease: "easeIn" as const },
            transformOrigin: { duration: 0 },
          },
    }),
  };

  const renderDays = (month: Date) => {
    const days = monthDays(month, weekStartsOn);
    return (
      <div
        className="rounded-2xl"
        role="grid"
        aria-label={`${monthFormatter.format(month)} ${month.getFullYear()}`}
      >
        <div className="mb-1 grid grid-cols-7" role="row">
          {weekdays.map((weekday) => (
            <span
              key={weekday}
              className="grid h-8 place-items-center text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
              role="columnheader"
              aria-label={weekday}
            >
              {weekday.slice(0, 2)}
            </span>
          ))}
        </div>
        <div
          className="relative grid grid-cols-7 gap-1"
          role="rowgroup"
          onPointerLeave={() => setDayHoverVisible(false)}
        >
          {days.map((date) => {
            const outside = date.getMonth() !== month.getMonth();
            const selected = isSameDay(date, selectedDate);
            const current = isSameDay(date, today);
            return (
              <button
                key={dateKey(date)}
                type="button"
                data-calendar-day
                data-date-key={dateKey(date)}
                data-selected={selected || undefined}
                role="gridcell"
                aria-label={accessibleDateFormatter.format(date)}
                aria-selected={selected}
                tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
                onFocus={() => setFocusedDate(date)}
                onKeyDown={(event) => handleDayKeyDown(event, date)}
                onClick={() => selectDate(date)}
                onPointerEnter={() => {
                  if (selected) {
                    setDayHoverVisible(false);
                    return;
                  }
                  setHoveredDay(dateKey(date));
                  setDayHoverVisible(true);
                }}
                className={cx(
                  "relative z-[1] grid aspect-square min-h-9 place-items-center rounded-full text-sm font-medium outline-none transition-colors duration-[var(--duration-fast)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                  outside && "text-[color-mix(in_srgb,var(--text-secondary)_48%,transparent)]",
                  selected && "text-[var(--primary-foreground)]",
                  current && !selected && "text-[var(--focus)] after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current",
                )}
              >
                {hoveredDay === dateKey(date) ? (
                  <motion.span
                    layoutId={`${calendarId}-day-hover`}
                    className="pointer-events-none absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--surface-muted)_24%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
                    initial={false}
                    animate={{ opacity: dayHoverVisible ? 1 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : {
                      layout: motionTokens.spring.smooth,
                      opacity: { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard },
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                {selected ? (
                  <motion.span
                    layoutId={`${calendarId}-selected-day`}
                    className="pointer-events-none absolute inset-0 rounded-full bg-[var(--primary)]"
                    transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-[1]">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    if (variant === "compact") {
      return (
        <div className="grid grid-cols-3 gap-2" role="grid" aria-label={`Months in ${cursorMonth.getFullYear()}`}>
          {monthLabels.map((label, month) => {
            const active = selectedDate.getFullYear() === cursorMonth.getFullYear() && selectedDate.getMonth() === month;
            return (
              <button
                key={label}
                type="button"
                role="gridcell"
                aria-selected={active}
                onClick={() => {
                  setCursorMonth(new Date(cursorMonth.getFullYear(), month, 1));
                  setFocusedDate(new Date(cursorMonth.getFullYear(), month, 1));
                  setZoom({ kind: "origin", dir: 1, origin: gridOrigin(month, 3) });
                  setView("days");
                }}
                className={cx(
                  "min-h-12 rounded-xl px-2 text-sm font-medium outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  active && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      );
    }

    // Full variant: each cell is a scaled down copy of the days grid (square cells, 7 columns),
    // so the zoom can enlarge it into the real days page without it turning into another calendar.
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="grid" aria-label={`Months in ${cursorMonth.getFullYear()}`}>
        {monthLabels.map((label, month) => {
          const monthDate = new Date(cursorMonth.getFullYear(), month, 1);
          const active = selectedDate.getFullYear() === cursorMonth.getFullYear() && selectedDate.getMonth() === month;
          return (
            <button
              key={label}
              type="button"
              role="gridcell"
              aria-label={`Open ${label} ${cursorMonth.getFullYear()}`}
              aria-selected={active}
              onClick={(event) => {
                setCursorMonth(monthDate);
                setFocusedDate(monthDate);
                const wrapper = wrapperRef.current;
                const miniGrid = event.currentTarget.querySelector("[data-mini-grid]");
                if (wrapper && miniGrid) {
                  const wrapperBox = wrapper.getBoundingClientRect();
                  const box = miniGrid.getBoundingClientRect();
                  setZoom({
                    kind: "rect",
                    dir: 1,
                    rect: {
                      x: box.left - wrapperBox.left - 4,
                      y: box.top - wrapperBox.top - 4,
                      w: box.width,
                      h: box.height,
                    },
                    width: wrapper.clientWidth - 8,
                  });
                } else {
                  setZoom({ kind: "origin", dir: 1, origin: gridOrigin(month, monthColumns(variant)) });
                }
                setView("days");
              }}
              className={cx(
                "block rounded-2xl p-3 text-left outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                active && "bg-[var(--surface-muted)]",
              )}
            >
              <span className={cx("mb-2 block text-sm font-semibold", active && "text-[var(--focus)]")}>{label}</span>
              <span data-mini-grid className="block" aria-hidden="true">
                <span className="grid grid-cols-7 items-center" style={{ aspectRatio: `${MINI_HEADER_RATIO} / 1` }}>
                  {weekdays.map((weekday) => (
                    <span key={weekday} className="text-center text-[0.5rem] font-semibold leading-none text-[var(--text-secondary)]">
                      {weekday.slice(0, 1)}
                    </span>
                  ))}
                </span>
                <span className="grid grid-cols-7">
                  {monthDays(monthDate, weekStartsOn).map((date) => {
                    const outside = date.getMonth() !== month;
                    const selected = isSameDay(date, selectedDate);
                    const current = isSameDay(date, today);
                    return (
                      <span
                        key={dateKey(date)}
                        className={cx(
                          "grid aspect-square place-items-center rounded-full text-[0.58rem] font-medium leading-none",
                          outside && "text-[color-mix(in_srgb,var(--text-secondary)_48%,transparent)]",
                          selected && "bg-[var(--primary)] text-[var(--primary-foreground)]",
                          current && !selected && "text-[var(--focus)]",
                        )}
                      >
                        {date.getDate()}
                      </span>
                    );
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderYears = () => (
    <div className="grid grid-cols-3 gap-2" role="grid" aria-label={`Years ${yearPageStart} to ${yearPageStart + 11}`}>
      {Array.from({ length: 12 }, (_, index) => yearPageStart + index).map((year) => {
        const active = selectedDate.getFullYear() === year;
        return (
          <button
            key={year}
            type="button"
            role="gridcell"
            aria-selected={active}
            onClick={() => {
              setCursorMonth(new Date(year, cursorMonth.getMonth(), 1));
              setZoom({ kind: "origin", dir: 1, origin: gridOrigin(year - yearPageStart, 3) });
              setView("months");
            }}
            className={cx(
              "min-h-12 rounded-xl px-2 text-sm font-medium outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
              active && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
            )}
          >
            {year}
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      aria-label={ariaLabel}
      data-sya-calendar
      className={cx(
        "w-full overflow-hidden rounded-[calc(var(--radius-surface)+6px)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-resting)]",
        variant === "compact" ? "max-w-[23rem] p-4" : "max-w-[64rem] p-5 sm:p-6",
        className,
      )}
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Selected date</p>
          <MorphingText value={selectedFormatter.format(selectedDate)} className="max-w-full text-xl font-semibold sm:text-2xl" />
        </div>
        <button
          type="button"
          onClick={() => {
            selectDate(today);
            changeView("days", today.getMonth());
          }}
          className="min-h-9 rounded-full px-3 text-sm font-semibold text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          Today
        </button>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => changeView("months")}
            aria-pressed={view === "months"}
            className="truncate rounded-lg px-2 py-1 text-base font-semibold outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          >
            {monthFormatter.format(cursorMonth)}
          </button>
          <button
            type="button"
            onClick={() => changeView("years")}
            aria-pressed={view === "years"}
            className="rounded-lg px-2 py-1 text-base font-semibold text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          >
            {view === "years" ? `${yearPageStart}–${yearPageStart + 11}` : cursorMonth.getFullYear()}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Previous" onClick={() => navigate(-1)} className="grid size-9 place-items-center rounded-full text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"><ChevronLeft size={18} aria-hidden="true" /></button>
          <button type="button" aria-label="Next" onClick={() => navigate(1)} className="grid size-9 place-items-center rounded-full text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      </div>

      {/* The 4px padding with a matching negative margin keeps focus rings from being clipped while zooming. */}
      <motion.div
        ref={wrapperRef}
        className="relative -m-1 overflow-hidden p-1"
        initial={false}
        animate={{ height: height ?? "auto" }}
        transition={heightTransition}
      >
        <AnimatePresence initial={false} mode="popLayout" custom={zoom}>
          <motion.div
            key={pageKey}
            custom={zoom}
            variants={pageVariants}
            initial="enter"
            animate="visible"
            exit="exit"
            className="w-full"
            style={{ willChange: "transform, opacity" }}
          >
            <MeasuredPage onHeight={handleHeight}>
              {view === "days" ? renderDays(cursorMonth) : view === "months" ? renderMonths() : renderYears()}
            </MeasuredPage>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
