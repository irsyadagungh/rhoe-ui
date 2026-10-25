"use client";

import { LineChart, type LineChartDatum, type LineChartRange } from "../../components/line-chart/line-chart";
import { RollingNumber } from "../../components/rolling-number/rolling-number";
import { Tabs } from "../../components/tabs/tabs";
import "../../components/foundation.css";

export interface RealtimeLineChartProps {
  data: readonly LineChartDatum[];
  title: string;
  description?: string;
  ranges?: readonly LineChartRange[];
  range?: string;
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  windowSize?: number;
  updateInterval?: number;
  domain?: readonly [number, number];
  spikeThreshold?: number;
  spikeColor?: string;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  className?: string;
}

export function RealtimeLineChart({
  data,
  title,
  description,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  windowSize = 31,
  updateInterval = 1000,
  domain,
  spikeThreshold,
  spikeColor,
  locale,
  format,
  className,
}: RealtimeLineChartProps) {
  const latest = data.at(-1)?.value ?? 0;

  return (
    <section className={["w-full text-[var(--text)]", className].filter(Boolean).join(" ")}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="text-lg font-[650] tracking-[-0.02em]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          <div className="mt-5 text-4xl font-[620] tracking-[-0.03em]">
            <RollingNumber value={latest} locale={locale} format={format} />
          </div>
        </div>
        {ranges?.length ? (
          <Tabs
            items={ranges.map((item) => ({ ...item, content: null }))}
            value={range}
            defaultValue={defaultRange}
            onValueChange={onRangeChange}
            variant="grouped"
            ariaLabel="Realtime chart range"
            className="ml-auto max-w-full"
            panelClassName="hidden"
          />
        ) : null}
      </header>

      <LineChart
        data={data}
        windowSize={windowSize}
        advanceDuration={updateInterval / 1000}
        domain={domain}
        spikeThreshold={spikeThreshold}
        spikeColor={spikeColor}
        locale={locale}
        format={format}
        showAverage
        height={280}
      />
    </section>
  );
}
