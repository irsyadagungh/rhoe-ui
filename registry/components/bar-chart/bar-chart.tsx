"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MorphingText } from "../morphing-text/morphing-text";
import { RollingNumber } from "../rolling-number/rolling-number";
import { Tabs } from "../tabs/tabs";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartRange {
  value: string;
  label: string;
}

export interface BarChartProps {
  data: readonly BarChartDatum[];
  title?: string;
  description?: string;
  ranges?: readonly BarChartRange[];
  range?: string;
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  orientation?: "vertical" | "horizontal";
  height?: number;
  barColor?: string;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  className?: string;
}

export function BarChart({
  data,
  title,
  description,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  orientation = "vertical",
  height = 320,
  barColor = "var(--focus)",
  locale = "en-US",
  format,
  className,
}: BarChartProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [format, locale]);
  const max = Math.max(0, ...data.map(({ value }) => value)) || 1;
  const ticks = [max, max / 2, 0];
  const chartHeight = Math.max(220, height);
  const active = activeIndex === null ? null : data[activeIndex];
  const transition = reduceMotion ? { duration: 0 } : motionTokens.spring.smooth;
  const selectVerticalBar = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(bounds.width - 1, event.clientX - bounds.left));
    setActiveIndex(Math.min(data.length - 1, Math.floor((position / bounds.width) * data.length)));
  };
  const selectHorizontalBar = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(bounds.height - 1, event.clientY - bounds.top));
    setActiveIndex(Math.min(data.length - 1, Math.floor((position / bounds.height) * data.length)));
  };

  return (
    <figure className={["w-full text-[var(--text)]", className].filter(Boolean).join(" ")}>
      {(title || description || ranges?.length) && (
        <figcaption className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h3 className="text-lg font-[650] tracking-[-0.02em]">{title}</h3>}
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
          {ranges?.length ? (
            <Tabs
              items={ranges.map((item) => ({ ...item, content: null }))}
              value={range}
              defaultValue={defaultRange}
              variant="grouped"
              ariaLabel="Chart range"
              panelClassName="hidden"
              onValueChange={onRangeChange}
            />
          ) : null}
        </figcaption>
      )}

      {data.length ? (
        orientation === "vertical" ? (
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
            <div className="flex flex-col justify-between pb-8 text-right text-xs text-[var(--text-secondary)]" style={{ height: chartHeight }}>
              {ticks.map((tick) => <RollingNumber key={tick} value={tick} locale={locale} format={format} />)}
            </div>
            <div
              className="relative"
              style={{ height: chartHeight }}
              onPointerMove={selectVerticalBar}
              onPointerLeave={() => setActiveIndex(null)}
            >
              <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between" aria-hidden="true">
                {ticks.map((tick) => <span className="border-t border-[var(--border)]" key={tick} />)}
              </div>
              <div className="absolute inset-x-0 top-0 bottom-0 flex items-end gap-2 sm:gap-3">
                {data.map((datum, index) => (
                  <button
                    type="button"
                    className="group relative flex h-full min-w-0 flex-1 flex-col border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
                    aria-label={`${datum.label}: ${formatter.format(datum.value)}`}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    key={`${datum.label}-${index}`}
                  >
                    <span className="flex min-h-0 w-full flex-1 items-end justify-center">
                      <motion.span
                        className="block w-[58%] min-w-2 opacity-80 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
                        initial={reduceMotion ? false : { height: 0 }}
                        animate={{ height: `${Math.max(2, (datum.value / max) * 100)}%` }}
                        transition={transition}
                        style={{ background: barColor, borderRadius: "10px 10px 0 0" }}
                        aria-hidden="true"
                      />
                    </span>
                    <MorphingText value={datum.label} className="flex h-8 w-full shrink-0 items-end justify-center truncate pt-2 text-xs text-[var(--text-secondary)]" />
                  </button>
                ))}
              </div>
              {active && activeIndex !== null && (
                <motion.div
                  className="pointer-events-none absolute z-10 min-w-24 -translate-x-1/2 -translate-y-full rounded-xl bg-[var(--primary)] px-3 py-2 text-center text-xs text-[var(--primary-foreground)] shadow-[var(--shadow-floating)]"
                  initial={false}
                  animate={{
                    left: `${((activeIndex + 0.5) / data.length) * 100}%`,
                    top: `${Math.max(0, (1 - active.value / max) * ((chartHeight - 32) / chartHeight) * 100)}%`,
                  }}
                  transition={transition}
                >
                  <MorphingText value={active.label} className="block opacity-70" />
                  <strong className="mt-0.5 block text-sm font-[650] tabular-nums">
                    <RollingNumber value={active.value} locale={locale} format={format} />
                  </strong>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div
              className="relative grid gap-3"
              style={{ minHeight: chartHeight - 24 }}
              onPointerMove={selectHorizontalBar}
              onPointerLeave={() => setActiveIndex(null)}
            >
              {data.map((datum, index) => (
                <button
                  type="button"
                  className="group grid min-h-10 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
                  aria-label={`${datum.label}: ${formatter.format(datum.value)}`}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  key={`${datum.label}-${index}`}
                >
                  <MorphingText value={datum.label} className="truncate text-xs text-[var(--text-secondary)]" />
                  <span className="relative block h-full min-h-8 border-l border-[var(--border)]">
                    <motion.span
                      className="absolute inset-y-1 left-0 opacity-80 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${Math.max(2, (datum.value / max) * 100)}%` }}
                      transition={transition}
                      style={{ background: barColor, borderRadius: "0 10px 10px 0" }}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ))}
              {active && activeIndex !== null && (
                <motion.div
                  className="pointer-events-none absolute right-0 z-10 min-w-24 -translate-y-1/2 rounded-xl bg-[var(--primary)] px-3 py-2 text-center text-xs text-[var(--primary-foreground)] shadow-[var(--shadow-floating)]"
                  initial={false}
                  animate={{ top: `${((activeIndex + 0.5) / data.length) * 100}%` }}
                  transition={transition}
                >
                  <MorphingText value={active.label} className="block opacity-70" />
                  <strong className="mt-0.5 block text-sm font-[650] tabular-nums">
                    <RollingNumber value={active.value} locale={locale} format={format} />
                  </strong>
                </motion.div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)] gap-3 text-xs text-[var(--text-secondary)]">
              <span aria-hidden="true" />
              <div className="flex justify-between border-t border-[var(--border)] pt-2">
                {[0, max / 2, max].map((tick) => <RollingNumber key={tick} value={tick} locale={locale} format={format} />)}
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="grid min-h-56 place-items-center text-sm text-[var(--text-secondary)]">No data available</div>
      )}

      <ul className="sr-only">
        {data.map((datum, index) => <li key={`${datum.label}-${index}`}>{datum.label}: {formatter.format(datum.value)}</li>)}
      </ul>
    </figure>
  );
}
