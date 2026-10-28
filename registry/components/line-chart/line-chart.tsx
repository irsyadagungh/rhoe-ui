"use client";

import { type PointerEvent, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MorphingText } from "../morphing-text/morphing-text";
import { RollingNumber } from "../rolling-number/rolling-number";
import { Tabs } from "../tabs/tabs";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface LineChartDatum {
  label: string;
  value: number;
}

export interface LineChartRange {
  value: string;
  label: string;
}

export interface LineChartProps {
  data: readonly LineChartDatum[];
  title?: string;
  description?: string;
  height?: number;
  showAverage?: boolean;
  averageLabel?: string;
  ranges?: readonly LineChartRange[];
  range?: string;
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  domain?: readonly [number, number];
  windowSize?: number;
  advanceDuration?: number;
  spikeThreshold?: number;
  spikeColor?: string;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  className?: string;
}

const WIDTH = 720;
const PADDING = { top: 28, right: 28, bottom: 38, left: 58 };

function smoothPath(points: readonly [number, number][]) {
  if (points.length < 2) return points.length ? `M ${points[0][0]} ${points[0][1]}` : "";

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const before = points[index - 1] ?? previous;
    const after = points[index + 2] ?? point;
    const firstControlX = previous[0] + (point[0] - before[0]) / 6;
    const firstControlY = previous[1] + (point[1] - before[1]) / 6;
    const secondControlX = point[0] - (after[0] - previous[0]) / 6;
    const secondControlY = point[1] - (after[1] - previous[1]) / 6;
    return `${path} C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${point[0]} ${point[1]}`;
  }, `M ${points[0][0]} ${points[0][1]}`);
}

function smoothYAt(points: readonly [number, number][], index: number, progress: number) {
  const start = points[index];
  const end = points[index + 1] ?? start;
  const before = points[index - 1] ?? start;
  const after = points[index + 2] ?? end;
  const controlOne = start[1] + (end[1] - before[1]) / 6;
  const controlTwo = end[1] - (after[1] - start[1]) / 6;
  const inverse = 1 - progress;
  return inverse ** 3 * start[1]
    + 3 * inverse ** 2 * progress * controlOne
    + 3 * inverse * progress ** 2 * controlTwo
    + progress ** 3 * end[1];
}

export function LineChart({
  data,
  title,
  description,
  height = 320,
  showAverage = true,
  averageLabel = "Average",
  ranges,
  range,
  defaultRange,
  onRangeChange,
  domain,
  windowSize,
  advanceDuration = 1,
  spikeThreshold,
  spikeColor = "var(--danger)",
  locale = "en-US",
  format,
  className,
}: LineChartProps) {
  const gradientId = useId().replaceAll(":", "");
  const spikeClipId = `${gradientId}-spike`;
  const plotClipId = `${gradientId}-plot`;
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [guideX, setGuideX] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartHeight = Math.max(220, height);
  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [format, locale]);

  const chart = useMemo(() => {
    if (!data.length) return null;
    const visibleCount = Math.min(Math.max(2, windowSize ?? data.length), data.length);
    const visibleStart = Math.max(0, data.length - visibleCount);
    const values = data.slice(visibleStart).map(({ value }) => value);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const rawMin = domain?.[0] ?? Math.min(...values, average);
    const rawMax = domain?.[1] ?? Math.max(...values, average);
    const range = rawMax - rawMin || Math.max(Math.abs(rawMax), 1);
    const min = domain ? rawMin : rawMin - range * 0.16;
    const max = domain ? rawMax : rawMax + range * 0.16;
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = chartHeight - PADDING.top - PADDING.bottom;
    const slots = Math.max(1, (windowSize ?? data.length) - 1);
    const step = innerWidth / slots;
    const x = (index: number) => PADDING.left + (data.length === 1 ? innerWidth / 2 : index * step);
    const y = (value: number) => PADDING.top + ((max - value) / (max - min)) * innerHeight;
    const points = data.map(({ value }, index) => [x(index), y(value)] as [number, number]);
    const offset = windowSize ? Math.max(0, data.length - windowSize) * step : 0;
    const ticks = [max, (max + min) / 2, min];
    const path = smoothPath(points);
    const areaPath = `${path} L ${points.at(-1)?.[0]} ${chartHeight - PADDING.bottom} L ${points[0][0]} ${chartHeight - PADDING.bottom} Z`;
    const spikeY = spikeThreshold === undefined
      ? null
      : Math.max(PADDING.top, Math.min(chartHeight - PADDING.bottom, y(spikeThreshold)));
    return { areaPath, average, averageY: y(average), innerHeight, innerWidth, max, min, offset, path, points, spikeY, ticks, visibleCount, visibleStart };
  }, [chartHeight, data, domain, spikeThreshold, windowSize]);

  const selectNearest = (event: PointerEvent<SVGSVGElement>) => {
    if (!chart || data.length < 2) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;
    const position = PADDING.left + (cursorX / bounds.width) * chart.innerWidth;
    const nextGuideX = Math.max(PADDING.left, Math.min(WIDTH - PADDING.right, position));
    setGuideX(nextGuideX);
    const ratio = (position - PADDING.left) / chart.innerWidth;
    const localIndex = Math.max(0, Math.min(chart.visibleCount - 1, Math.round(ratio * (chart.visibleCount - 1))));
    const nextIndex = chart.visibleStart + localIndex;
    setActiveIndex(nextIndex);
    setTooltipPosition({
      x: PADDING.left + ((nextGuideX - PADDING.left) / chart.innerWidth) * bounds.width,
      y: Math.max(64, Math.min(bounds.height, cursorY)),
    });
  };

  const hoverPosition = chart
    ? Math.max(0, Math.min(chart.visibleCount - 1, ((guideX - PADDING.left) / chart.innerWidth) * (chart.visibleCount - 1)))
    : 0;
  const hoverSegment = chart ? Math.max(0, Math.min(chart.visibleCount - 2, Math.floor(hoverPosition))) : 0;
  const resolvedIndex = chart ? chart.visibleStart + Math.round(hoverPosition) : 0;
  const activePoint = activeIndex === null || !chart
    ? null
    : [
        guideX,
        smoothYAt(chart.points, chart.visibleStart + hoverSegment, hoverPosition - hoverSegment),
      ] as [number, number];

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

      {chart ? (
        <div className="relative w-full">
          <svg
            className="block touch-none overflow-visible"
            style={{ height: chartHeight, marginLeft: PADDING.left, width: `calc(100% - ${PADDING.left + PADDING.right}px)` }}
            viewBox={`${PADDING.left} 0 ${chart.innerWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            tabIndex={0}
            aria-label={title ? `${title} line chart; use left and right arrow keys to explore values` : "Line chart; use left and right arrow keys to explore values"}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const first = chart.visibleStart;
              const last = first + chart.visibleCount - 1;
              const next = event.key === "Home" ? first : event.key === "End" ? last : Math.max(first, Math.min(last, (activeIndex ?? first) + (event.key === "ArrowRight" ? 1 : -1)));
              const local = next - first;
              const x = PADDING.left + local / Math.max(1, chart.visibleCount - 1) * chart.innerWidth;
              const bounds = event.currentTarget.getBoundingClientRect();
              setGuideX(x);
              setActiveIndex(next);
              setTooltipPosition({ x: PADDING.left + (x - PADDING.left) / chart.innerWidth * bounds.width, y: Math.max(64, Math.min(bounds.height, chart.points[next]?.[1] ?? 64)) });
            }}
            onBlur={() => setActiveIndex(null)}
            onPointerMove={selectNearest}
            onPointerLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--focus)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--focus)" stopOpacity="0" />
              </linearGradient>
              {chart.spikeY !== null && (
                <clipPath id={spikeClipId} clipPathUnits="userSpaceOnUse">
                  <rect
                    x="0"
                    y={PADDING.top}
                    width={(chart.points.at(-1)?.[0] ?? WIDTH) + PADDING.right}
                    height={Math.max(0, chart.spikeY - PADDING.top)}
                  />
                </clipPath>
              )}
              <clipPath id={plotClipId} clipPathUnits="userSpaceOnUse">
                <rect x={PADDING.left} y={PADDING.top} width={chart.innerWidth} height={chart.innerHeight} />
              </clipPath>
            </defs>

            {[0, 0.5, 1].map((ratio) => {
              const y = PADDING.top + chart.innerHeight * ratio;
              return (
                <line key={ratio} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--border)" strokeOpacity="0.72" />
              );
            })}

            {showAverage && (
              <g>
                <motion.line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  initial={false}
                  animate={{ y1: chart.averageY, y2: chart.averageY }}
                  transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                  stroke="var(--text-secondary)"
                  strokeDasharray="5 7"
                  strokeOpacity="0.72"
                />
              </g>
            )}

            <g clipPath={`url(#${plotClipId})`}>
              <motion.g
                key={windowSize ?? "static"}
                initial={false}
                animate={{ transform: `translate3d(${-chart.offset}px, 0px, 0px)` }}
                transition={reduceMotion ? { duration: 0 } : { duration: advanceDuration, ease: "linear" }}
              >
                <motion.path
                  initial={false}
                  animate={{ d: chart.areaPath }}
                  transition={windowSize || reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                  fill={`url(#${gradientId})`}
                  pointerEvents="none"
                />
                <motion.path
                  initial={false}
                  animate={{ d: chart.path }}
                  transition={windowSize || reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                  fill="none"
                  stroke="var(--focus)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  pointerEvents="none"
                />
                {chart.spikeY !== null && (
                  <motion.path
                    initial={false}
                    animate={{ d: chart.path }}
                    transition={windowSize || reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                    fill="none"
                    stroke={spikeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    clipPath={`url(#${spikeClipId})`}
                    pointerEvents="none"
                  />
                )}
              </motion.g>
            </g>

            {activePoint && activeIndex !== null && (
              <g pointerEvents="none">
                <motion.g
                  initial={false}
                  animate={{ transform: `translate3d(${guideX}px, 0px, 0px)` }}
                  transition={reduceMotion ? { duration: 0 } : {
                    duration: motionTokens.duration.instant,
                    ease: motionTokens.ease.standard,
                  }}
                >
                  <line x1="0" x2="0" y1={PADDING.top} y2={chartHeight - PADDING.bottom} stroke="var(--text-secondary)" strokeDasharray="3 6" strokeOpacity="0.42" />
                </motion.g>
                <motion.g
                  initial={false}
                  animate={{ transform: `translate3d(${activePoint[0]}px, ${activePoint[1]}px, 0px)` }}
                  transition={reduceMotion ? { duration: 0 } : windowSize
                    ? { duration: advanceDuration, ease: "linear" }
                    : motionTokens.spring.smooth}
                >
                  <circle cx="0" cy="0" r="7" fill="var(--surface)" stroke="var(--focus)" strokeWidth="3" />
                </motion.g>
              </g>
            )}

          </svg>

          {/* Keep animated HTML outside SVG: foreignObject can misplace transformed
              descendants in WebKit. Both layers use the same plot coordinates. */}
          <div className="pointer-events-none absolute inset-0 text-xs text-[var(--text-secondary)]">
            {chart.ticks.map((tick, index) => (
              <div
                key={index}
                className="absolute left-0 flex h-5 items-center justify-end"
                style={{
                  top: PADDING.top + chart.innerHeight * index / 2 - 10,
                  width: PADDING.left - 10,
                }}
              >
                <RollingNumber value={tick} locale={locale} format={format} />
              </div>
            ))}

            {showAverage && (
              <motion.div
                className="absolute top-0 flex h-6 items-center justify-end gap-1 whitespace-nowrap"
                style={{ right: PADDING.right }}
                initial={false}
                animate={{ transform: `translateY(${chart.averageY - 25}px)` }}
                transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
              >
                <MorphingText value={averageLabel} />
                <span>·</span>
                <RollingNumber value={chart.average} locale={locale} format={format} />
              </motion.div>
            )}

            <div className="absolute inset-y-0" style={{ left: PADDING.left, right: PADDING.right }}>
              {data.map((datum, index) => {
                if (index < chart.visibleStart) return null;
                const localIndex = index - chart.visibleStart;
                const labelStep = Math.max(1, Math.round((chart.visibleCount - 1) / 6));
                const showLabel = chart.visibleCount <= 7 || localIndex % labelStep === 0 || index === data.length - 1;
                return showLabel ? (
                  <div
                    key={localIndex}
                    className={[
                      "absolute flex h-5 w-[88px] items-center",
                      localIndex === 0 ? "justify-start" : index === data.length - 1 ? "justify-end" : "justify-center",
                    ].join(" ")}
                    style={{
                      left: `${((chart.points[localIndex][0] - PADDING.left) / chart.innerWidth) * 100}%`,
                      top: chartHeight - 28,
                      transform: localIndex === 0 ? "none" : index === data.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                    }}
                  >
                    <MorphingText value={datum.label} className="max-w-full overflow-hidden" />
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {activePoint && activeIndex !== null && data[resolvedIndex] && (
            <motion.div
              className="pointer-events-none absolute top-0 z-10 min-w-24 rounded-xl bg-[var(--primary)] px-3 py-2 text-center text-xs text-[var(--primary-foreground)] shadow-[var(--shadow-floating)]"
              initial={false}
              animate={{ transform: `translate3d(${tooltipPosition.x}px, ${tooltipPosition.y - 58}px, 0px) translateX(-50%)` }}
              transition={reduceMotion ? { duration: 0 } : {
                duration: motionTokens.duration.instant,
                ease: motionTokens.ease.standard,
              }}
            >
              <MorphingText value={data[resolvedIndex].label} className="block opacity-70" />
              <strong className="mt-0.5 block text-sm font-[650] tabular-nums">
                <RollingNumber value={data[resolvedIndex].value} locale={locale} format={format} />
              </strong>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center text-sm text-[var(--text-secondary)]">No data available</div>
      )}

      <ul className="sr-only">
        {data.map((datum, index) => <li key={`${datum.label}-${index}`}>{datum.label}: {formatter.format(datum.value)}</li>)}
      </ul>
    </figure>
  );
}
