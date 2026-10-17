"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";
import { Button } from "../../components/button/button";
import { motionTokens } from "../../components/lib/motion-tokens";
import { MorphingText } from "../../components/morphing-text/morphing-text";
import "../../components/foundation.css";

export interface TodoCalendarItem {
  id: string;
  title: string;
  date: Date;
  description?: string;
  completed?: boolean;
}

export interface TodoCalendarProps extends Omit<HTMLMotionProps<"section">, "children" | "defaultValue" | "onChange"> {
  items: readonly TodoCalendarItem[];
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  onItemToggle?: (item: TodoCalendarItem) => void;
  /** Optional action rendered beside the calendar toggle, such as an add-to-do dialog. */
  addTodoAction?: ReactNode;
  locale?: string;
  weekStartsOn?: 0 | 1;
  defaultCalendarOpen?: boolean;
  ariaLabel?: string;
}

type Box = { x: number; y: number; w: number; h: number };

/** Spring used by the highlights. Slightly overdamped, so it never overshoots into a neighbour cell. */
const FOLLOW_SPRING = { stiffness: 420, damping: 40, mass: 0.8 };
/** How long the highlights keep re-measuring their target after something changes (rows are animating). */
const TRACK_MS = 900;
/** How long a selection change is allowed to travel with a spring before it follows the cell exactly. */
const TRAVEL_MS = 700;

function localDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date, weekStartsOn: 0 | 1) {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -offset);
}

function monthWeeks(month: Date, weekStartsOn: 0 | 1) {
  const start = startOfWeek(firstOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, week) => (
    Array.from({ length: 7 }, (__, day) => addDays(start, week * 7 + day))
  ));
}

function isSameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function weekKey(week: readonly Date[]) {
  return dateKey(week[0] ?? new Date(0));
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * A box (x, y, width, height) that follows a target with a spring.
 * `place(box, true)` jumps straight to the box, `place(box, false)` lets the spring travel there.
 */
function useBoxFollower(reduceMotion: boolean) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const targetW = useMotionValue(0);
  const targetH = useMotionValue(0);
  const x = useSpring(targetX, FOLLOW_SPRING);
  const y = useSpring(targetY, FOLLOW_SPRING);
  const width = useSpring(targetW, FOLLOW_SPRING);
  const height = useSpring(targetH, FOLLOW_SPRING);

  const place = useCallback(
    (box: Box, immediate: boolean) => {
      targetX.set(box.x);
      targetY.set(box.y);
      targetW.set(box.w);
      targetH.set(box.h);
      if (immediate || reduceMotion) {
        x.jump(box.x);
        y.jump(box.y);
        width.jump(box.w);
        height.jump(box.h);
      }
    },
    [height, reduceMotion, targetH, targetW, targetX, targetY, width, x, y],
  );

  return { style: { x, y, width, height }, place };
}

/** Animates its own height to match its content, so content can appear, change and vanish smoothly. */
function AutoHeight({
  transition,
  className,
  children,
}: {
  transition: Transition;
  className?: string;
  children: ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const report = () => setHeight(element.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      className={cx("overflow-hidden", className)}
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={transition}
    >
      <div ref={innerRef} className="relative">
        {children}
      </div>
    </motion.div>
  );
}

export function TodoCalendar({
  items,
  value,
  defaultValue,
  onValueChange,
  onItemToggle,
  addTodoAction,
  locale,
  weekStartsOn = 0,
  defaultCalendarOpen = false,
  ariaLabel = "To-do calendar",
  className,
  ...props
}: TodoCalendarProps) {
  const today = useMemo(() => localDate(new Date()), []);
  const initialDate = useMemo(
    () => localDate(value ?? defaultValue ?? today),
    // The initial value is intentionally captured once. Controlled updates are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [internalValue, setInternalValue] = useState(initialDate);
  const selectedDate = value ? localDate(value) : internalValue;
  const [cursorMonth, setCursorMonth] = useState(firstOfMonth(initialDate));
  const [controlledStamp, setControlledStamp] = useState(value?.getTime());
  const [calendarOpen, setCalendarOpen] = useState(defaultCalendarOpen);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [ready, setReady] = useState(false);
  // False while the selected date's cell is not on screen (another month is shown).
  const [selectedVisible, setSelectedVisible] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const gridRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const selectedVisibleRef = useRef(false);
  const hoverJumpRef = useRef(false);
  const travelUntilRef = useRef(0);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedDateRef = useRef(selectedDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const selectedFollower = useBoxFollower(reduceMotion);
  const hoverFollower = useBoxFollower(reduceMotion);
  const placeSelected = selectedFollower.place;
  const placeHover = hoverFollower.place;

  if (value && value.getTime() !== controlledStamp) {
    setControlledStamp(value.getTime());
    setCursorMonth(firstOfMonth(value));
  }

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearCollapseTimer, [clearCollapseTimer]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale],
  );
  const accessibleDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  const weeks = useMemo(
    () => monthWeeks(cursorMonth, weekStartsOn),
    [cursorMonth, weekStartsOn],
  );
  const selectedKey = dateKey(selectedDate);
  const lastSelectedKeyRef = useRef(selectedKey);
  const selectedWeekStart = startOfWeek(selectedDate, weekStartsOn);
  const activeWeekIndex = weeks.findIndex((week) => isSameDay(week[0]!, selectedWeekStart));
  const collapsedWeek = activeWeekIndex >= 0
    ? weeks[activeWeekIndex]!
    : Array.from({ length: 7 }, (_, index) => addDays(selectedWeekStart, index));

  // The selected week is only added as an extra row while the calendar is closed on another month,
  // so it can grow in while the month's own rows collapse. When open, the month always shows its own 6 weeks.
  const needsExtraRow = activeWeekIndex < 0 && !calendarOpen;
  const visibleWeeks = needsExtraRow ? [collapsedWeek, ...weeks] : weeks;
  const activeRow = needsExtraRow ? 0 : activeWeekIndex;

  const selectedItems = items.filter((item) => isSameDay(item.date, selectedDate));
  const itemDates = useMemo(() => new Set(items.map((item) => dateKey(item.date))), [items]);
  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(2024, 0, 7), weekStartsOn);
    return Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(addDays(start, index)));
  }, [weekdayFormatter, weekStartsOn]);

  /** Position of a day cell inside the grid container, measured from the real DOM. */
  const measure = useCallback((key: string | null): Box | null => {
    const grid = gridRef.current;
    if (!grid || !key) return null;
    const cell = grid.querySelector<HTMLElement>(`[data-day-key="${key}"]`);
    if (!cell) return null;
    const gridBox = grid.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    return { x: box.left - gridBox.left, y: box.top - gridBox.top, w: box.width, h: box.height };
  }, []);

  /**
   * Keeps the two highlights on their cells. The rows above them animate their height while the
   * calendar opens and closes, so the targets are re-measured every frame for a short while.
   */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    if (selectedKey !== lastSelectedKeyRef.current) {
      lastSelectedKeyRef.current = selectedKey;
      travelUntilRef.current = performance.now() + TRAVEL_MS;
    }

    let forceHoverJump = hoverJumpRef.current;
    hoverJumpRef.current = false;
    let frame = 0;
    const end = performance.now() + TRACK_MS;

    const sync = () => {
      const selectedBox = measure(selectedKey);
      if (selectedBox) {
        const wasReady = readyRef.current;
        const wasVisible = selectedVisibleRef.current;
        const travelling = performance.now() < travelUntilRef.current;
        // Jump when the highlight was hidden, so it appears on its cell instead of flying in.
        placeSelected(selectedBox, !wasReady || !wasVisible || !travelling);
        if (!wasReady) {
          readyRef.current = true;
          setReady(true);
        }
        if (!wasVisible) {
          selectedVisibleRef.current = true;
          setSelectedVisible(true);
        }
      } else if (selectedVisibleRef.current) {
        // The selected date is not part of the month on screen, so there is nothing to highlight.
        selectedVisibleRef.current = false;
        setSelectedVisible(false);
      }

      if (hoveredDate) {
        const hoverBox = measure(hoveredDate);
        if (hoverBox) {
          placeHover(hoverBox, forceHoverJump);
          forceHoverJump = false;
        }
      }
    };

    const tick = () => {
      sync();
      if (performance.now() < end) frame = requestAnimationFrame(tick);
    };
    tick();

    const observer = new ResizeObserver(sync);
    observer.observe(grid);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [calendarOpen, cursorMonth, hoveredDate, hoverVisible, measure, placeHover, placeSelected, selectedKey]);

  const selectDate = (date: Date) => {
    const next = localDate(date);
    clearCollapseTimer();
    if (value === undefined) setInternalValue(next);
    setCursorMonth(firstOfMonth(next));
    setHoverVisible(false);
    onValueChange?.(next);
  };

  const toggleCalendar = () => {
    setHoverVisible(false);
    clearCollapseTimer();

    if (!calendarOpen) {
      // Always open on the month of the selected date.
      setCursorMonth(firstOfMonth(selectedDate));
      setCalendarOpen(true);
      return;
    }

    setCalendarOpen(false);
    const selectedMonth = firstOfMonth(selectedDate);
    if (selectedMonth.getTime() === cursorMonth.getTime()) return;

    if (reduceMotion) {
      setCursorMonth(selectedMonth);
      return;
    }
    // Let the collapse finish on the month that is on screen, then return to the selected month.
    const settleMs = Math.round(motionTokens.duration.considered * 1000) + 60;
    collapseTimerRef.current = setTimeout(() => {
      collapseTimerRef.current = null;
      setCursorMonth(firstOfMonth(selectedDateRef.current));
    }, settleMs);
  };

  const heightTransition: Transition = reduceMotion
    ? { duration: 0 }
    : {
        height: {
          duration: motionTokens.duration.considered,
          ease: motionTokens.ease.standard,
        },
        opacity: {
          duration: motionTokens.duration.standard,
          ease: motionTokens.ease.standard,
        },
      };

  const highlightFade: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard };

  return (
    <motion.section
      {...props}
      aria-label={ariaLabel}
      className={cx(
        "w-full max-w-[34rem] overflow-hidden rounded-[calc(var(--radius-surface)+8px)] border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-[var(--shadow-resting)] sm:p-6",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Selected date
          </p>
          <MorphingText
            value={dateFormatter.format(selectedDate)}
            className="max-w-full text-2xl font-semibold leading-tight sm:text-[1.75rem]"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {addTodoAction}
          <Button
            variant="bordered"
            tone="secondary"
            size="small"
            icon={<CalendarDays />}
            aria-label={calendarOpen ? "Show week strip" : "Open compact calendar"}
            aria-expanded={calendarOpen}
            onClick={toggleCalendar}
          />
        </div>
      </header>

      {/* The wrapper animates its height, so the calendar below slides instead of jumping. */}
      <AutoHeight transition={heightTransition} className="-mx-1 px-1">
        <AnimatePresence initial={false} mode="popLayout">
          {selectedItems.length ? (
            <motion.ul
              key={selectedKey}
              className="grid gap-2 pb-0.5 pt-4"
              initial={reduceMotion ? false : { opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
              transition={reduceMotion ? { duration: 0 } : {
                opacity: { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard },
                transform: motionTokens.spring.smooth,
              }}
              aria-label={`Agenda for ${accessibleDateFormatter.format(selectedDate)}`}
            >
              {selectedItems.map((item) => {
                const content = (
                  <>
                    <span
                      className={cx(
                        "grid size-5 shrink-0 place-items-center rounded-full border",
                        item.completed
                          ? "border-[var(--success-surface-foreground)] bg-[var(--success-surface)] text-[var(--success-surface-foreground)]"
                          : "border-[var(--border)] text-transparent",
                      )}
                      aria-hidden="true"
                    >
                      <Check size={13} strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx("block text-sm font-semibold", item.completed && "text-[var(--text-secondary)] line-through")}>{item.title}</span>
                      {item.description ? <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{item.description}</span> : null}
                    </span>
                  </>
                );

                return (
                  <li key={item.id}>
                    {onItemToggle ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-3.5 py-3 text-left outline-none transition-colors duration-[var(--duration-fast)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_82%,var(--text))] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                        aria-pressed={item.completed}
                        onClick={() => onItemToggle(item)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-3.5 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </AutoHeight>

      <div className="mt-4">
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ height: calendarOpen ? "auto" : 0, opacity: calendarOpen ? 1 : 0 }}
          transition={heightTransition}
          aria-hidden={!calendarOpen}
        >
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-1">
              <Button
                variant="text"
                tone="secondary"
                size="small"
                icon={<ChevronLeft />}
                aria-label="Previous month"
                tabIndex={calendarOpen ? 0 : -1}
                onClick={() => setCursorMonth((month) => addMonths(month, -1))}
              />
              <Button
                variant="text"
                tone="secondary"
                size="small"
                icon={<ChevronRight />}
                aria-label="Next month"
                tabIndex={calendarOpen ? 0 : -1}
                onClick={() => setCursorMonth((month) => addMonths(month, 1))}
              />
            </div>
            <MorphingText value={monthFormatter.format(cursorMonth)} className="text-sm font-semibold" />
            <Button
              variant="text"
              tone="secondary"
              size="small"
              label="Today"
              tabIndex={calendarOpen ? 0 : -1}
              onClick={() => selectDate(today)}
            />
          </div>
          <div className="grid grid-cols-7 pb-1" role="row">
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                role="columnheader"
                className="grid h-8 place-items-center text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
              >
                {weekday.slice(0, 2)}
              </span>
            ))}
          </div>
        </motion.div>

        {/* The highlights live here, outside every row, so no row can clip them while they travel. */}
        <div
          ref={gridRef}
          className="relative isolate flex flex-col"
          role="grid"
          aria-label={calendarOpen ? monthFormatter.format(cursorMonth) : `Week of ${accessibleDateFormatter.format(collapsedWeek[0]!)}`}
          onPointerLeave={() => setHoverVisible(false)}
        >
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0 rounded-2xl bg-[color-mix(in_srgb,var(--surface-muted)_24%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
            style={hoverFollower.style}
            initial={false}
            animate={{ opacity: ready && hoverVisible ? 1 : 0 }}
            transition={highlightFade}
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0 rounded-2xl bg-[var(--primary)]"
            style={selectedFollower.style}
            initial={false}
            animate={{ opacity: ready && selectedVisible ? 1 : 0 }}
            transition={highlightFade}
          />

          {visibleWeeks.map((week, index) => {
            const visible = calendarOpen || index === activeRow;
            return (
              <motion.div
                key={weekKey(week)}
                role="row"
                className={cx("grid grid-cols-7 gap-1 overflow-hidden pb-1", !visible && "pointer-events-none")}
                initial={false}
                animate={{ height: visible ? "auto" : 0, opacity: visible ? 1 : 0 }}
                transition={heightTransition}
                aria-hidden={!visible}
              >
                {week.map((date) => {
                  const key = dateKey(date);
                  const selected = isSameDay(date, selectedDate);
                  const outside = date.getMonth() !== cursorMonth.getMonth();
                  const hasItems = itemDates.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      data-day-key={key}
                      aria-label={accessibleDateFormatter.format(date)}
                      aria-selected={selected}
                      tabIndex={visible ? 0 : -1}
                      onClick={() => selectDate(date)}
                      onPointerEnter={() => {
                        if (selected) {
                          setHoverVisible(false);
                          return;
                        }
                        // When the hover highlight is hidden it should appear on the cell, not travel to it.
                        hoverJumpRef.current = !hoverVisible;
                        setHoveredDate(key);
                        setHoverVisible(true);
                      }}
                      className={cx(
                        "relative grid min-h-14 place-items-center rounded-2xl px-1 py-2 text-sm font-semibold outline-none transition-colors duration-300 sm:min-h-16",
                        "focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                        outside && calendarOpen && "text-[color-mix(in_srgb,var(--text-secondary)_48%,transparent)]",
                        selected && "text-[var(--primary-foreground)]",
                      )}
                    >
                      <span className="relative z-[1] grid place-items-center gap-1">
                        {!calendarOpen ? (
                          <span className="text-[0.62rem] uppercase tracking-[0.08em] opacity-70">
                            {weekdayFormatter.format(date).slice(0, 2)}
                          </span>
                        ) : null}
                        <span>{date.getDate()}</span>
                        {hasItems ? <span className="size-1 rounded-full bg-current" aria-hidden="true" /> : null}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
