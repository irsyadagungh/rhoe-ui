"use client";

import { useEffect, useMemo, useState } from "react";
import { RealtimeLineChart } from "@/registry/blocks/realtime-line-chart/realtime-line-chart";

const initialValues = Array.from({ length: 121 }, (_, index) =>
  index % 30 === 24 ? 108 : index % 30 === 25 ? 122 : index % 30 === 26 ? 111 : 48 + Math.round(Math.sin(index / 2.8) * 5),
);
const incomingValues = [51, 53, 50, 52, 56, 54, 51, 49, 53, 55, 110, 124, 107, 57, 54, 52];
const ranges = [
  { value: "30", label: "30s" },
  { value: "60", label: "1m" },
  { value: "120", label: "2m" },
];

export function RealtimeLineChartExample() {
  const [values, setValues] = useState(initialValues);
  const [range, setRange] = useState("30");
  const data = useMemo(() => values.map((value, index) => {
    const age = values.length - 1 - index;
    const minutes = Math.floor(age / 60);
    const seconds = age % 60;
    const elapsed = minutes ? `${minutes}m${seconds ? ` ${seconds}s` : ""}` : `${seconds}s`;
    return { value, label: age === 0 ? "Now" : `${elapsed} ago` };
  }), [values]);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      const sample = incomingValues[index % incomingValues.length];
      setValues((current) => [...current, sample]);
      index += 1;
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl p-5 sm:p-8">
      <RealtimeLineChart
        data={data}
        title="API latency"
        description="A continuously moving window of recent measurements."
        ranges={ranges}
        range={range}
        onRangeChange={setRange}
        windowSize={Number(range) + 1}
        domain={[30, 130]}
        spikeThreshold={100}
        format={{ style: "unit", unit: "millisecond", unitDisplay: "short", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
