"use client";

import { useState } from "react";
import { LineChart } from "@/registry/components/line-chart/line-chart";

const weeklyRevenue = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 51 },
  { label: "Thu", value: 76 },
  { label: "Fri", value: 68 },
  { label: "Sat", value: 91 },
  { label: "Sun", value: 84 },
];

const monthlyRevenue = weeklyRevenue.map((item, index) => ({
  ...item,
  value: item.value + [18, 9, 24, 12, 31, 17, 27][index],
}));

const quarterlyRevenue = weeklyRevenue.map((item, index) => ({
  ...item,
  value: item.value + [37, 28, 45, 31, 54, 38, 49][index],
}));

const ranges = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

const dataByRange = {
  "7d": weeklyRevenue,
  "30d": monthlyRevenue,
  "90d": quarterlyRevenue,
};

export function LineChartExample() {
  const [range, setRange] = useState("7d");

  return (
    <div className="mx-auto w-full max-w-4xl p-5 sm:p-8">
      <LineChart
        data={dataByRange[range as keyof typeof dataByRange]}
        title="Weekly revenue"
        description="Revenue performance over the last seven days."
        ranges={ranges}
        range={range}
        onRangeChange={setRange}
        averageLabel="Average"
        format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
