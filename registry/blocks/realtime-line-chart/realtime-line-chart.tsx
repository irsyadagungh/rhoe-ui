"use client";

import { LineChart, type LineChartDatum } from "../../components/line-chart/line-chart";
import { MorphingText } from "../../components/morphing-text/morphing-text";
import { RollingNumber } from "../../components/rolling-number/rolling-number";
import "../../components/foundation.css";

export interface RealtimeLineChartProps {
  data: readonly LineChartDatum[];
  title: string;
  description?: string;
  status?: string;
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
  status = "Live",
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
      <header className="mb-6 flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="text-lg font-[650] tracking-[-0.02em]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          <div className="mt-5 text-4xl font-[620] tracking-[-0.03em]">
            <RollingNumber value={latest} locale={locale} format={format} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-[620] text-[var(--text-secondary)]">
          <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
          <MorphingText value={status} />
        </div>
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
