"use client";

import { useEffect, useState } from "react";
import { RealtimeLineChart } from "@/registry/blocks/realtime-line-chart/realtime-line-chart";

const initialData = Array.from({ length: 31 }, (_, index) => ({
  label: index === 30 ? "now" : `${index - 30}s`,
  value: index === 24 ? 108 : index === 25 ? 122 : index === 26 ? 111 : 48 + Math.round(Math.sin(index / 2.8) * 5),
}));
const incomingValues = [51, 53, 50, 52, 56, 54, 51, 49, 53, 55, 110, 124, 107, 57, 54, 52];

export function RealtimeLineChartExample() {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      setData((current) => [...current, { label: `Live ${index + 1}`, value: incomingValues[index % incomingValues.length] }]);
      index += 1;
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl p-5 sm:p-8">
      <RealtimeLineChart
        data={data}
        title="API latency"
        description="A continuously moving 30-second window."
        domain={[30, 130]}
        spikeThreshold={100}
        format={{ style: "unit", unit: "millisecond", unitDisplay: "short", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
