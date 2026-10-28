"use client";

import { useState } from "react";
import { DateRangePicker, type DateRange } from "@/registry/components/date-range-picker/date-range-picker";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function DateRangePickerSandbox() {
  const [variant, setVariant] = useState<"filled" | "bordered">("filled");
  const [range, setRange] = useState<DateRange>({});

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <Tabs
          variant="flat"
          ariaLabel="Date range picker variant"
          value={variant}
          onValueChange={(next) => setVariant(next as "filled" | "bordered")}
          items={[
            { value: "filled", label: "Filled", content: <span /> },
            { value: "bordered", label: "Bordered", content: <span /> },
          ]}
        />
      )}
    >
      <div className="flex min-h-[32rem] w-full items-start justify-center p-8 pt-24">
        <div className="w-full max-w-md">
          <DateRangePicker
            label="Project timeline"
            value={range}
            onValueChange={setRange}
            variant={variant}
          />
        </div>
      </div>
    </PreviewCanvas>
  );
}
