"use client";

import { useState } from "react";
import { BarChart } from "@/registry/components/bar-chart/bar-chart";

const revenue = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 51 },
  { label: "Thu", value: 76 },
  { label: "Fri", value: 68 },
  { label: "Sat", value: 91 },
  { label: "Sun", value: 84 },
];

const dataByRange = {
  "7d": revenue,
  "30d": revenue.map((item, index) => ({ ...item, value: item.value + [12, 8, 19, 15, 24, 17, 21][index] })),
  "90d": revenue.map((item, index) => ({ ...item, value: item.value + [31, 26, 38, 29, 47, 35, 42][index] })),
};

const ranges = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

export function BarChartExample({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const [range, setRange] = useState("7d");

  return (
    <div className="mx-auto w-full max-w-4xl p-5 sm:p-8">
      <BarChart
        data={dataByRange[range as keyof typeof dataByRange]}
        title="Weekly revenue"
        description="Revenue by day over the last week."
        orientation={orientation}
        ranges={ranges}
        range={range}
        onRangeChange={setRange}
        format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
