"use client";

import { useState } from "react";
import { Calendar, type CalendarVariant } from "@/registry/components/calendar/calendar";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function CalendarSandbox() {
  const [variant, setVariant] = useState<CalendarVariant>("compact");
  const [date, setDate] = useState(() => new Date(2020, 1, 8));

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <Tabs
          variant="flat"
          ariaLabel="Calendar variant"
          value={variant}
          onValueChange={(nextVariant) => setVariant(nextVariant as CalendarVariant)}
          items={[
            { value: "compact", label: "Compact", content: <span /> },
            { value: "full", label: "Full", content: <span /> },
          ]}
        />
      )}
    >
      <div className="flex min-h-[34rem] w-full items-start justify-center py-6">
        <Calendar
          key={variant}
          variant={variant}
          value={date}
          onValueChange={setDate}
          locale="en-US"
        />
      </div>
    </PreviewCanvas>
  );
}
