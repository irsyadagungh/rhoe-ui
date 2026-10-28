"use client";

import { useState } from "react";
import { DatePicker } from "@/registry/components/date-picker/date-picker";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function DatePickerSandbox() {
  const [variant, setVariant] = useState<"filled" | "bordered">("filled");
  const [date, setDate] = useState<Date>();

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <Tabs
          variant="flat"
          ariaLabel="Date picker variant"
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
          <DatePicker label="Launch date" value={date} onValueChange={setDate} variant={variant} />
        </div>
      </div>
    </PreviewCanvas>
  );
}
