"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Calendar, type CalendarDateRange } from "../calendar/calendar";
import { DateFieldPopover } from "../lib/date-field-popover";
import { motionTokens } from "../lib/motion-tokens";

export type DateRange = CalendarDateRange;

export interface DateRangePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange) => void;
  label?: ReactNode;
  placeholder?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
  fromName?: string;
  toName?: string;
  disabled?: boolean;
  errorMessage?: ReactNode;
  variant?: "filled" | "bordered";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnComplete?: boolean;
  className?: string;
}

function inputDate(date?: Date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  label,
  placeholder = "Choose a date range",
  locale = "en-US",
  weekStartsOn = 0,
  fromName,
  toName,
  closeOnComplete = true,
  onOpenChange,
  ...fieldProps
}: DateRangePickerProps) {
  const [internalValue, setInternalValue] = useState<DateRange>(defaultValue ?? {});
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const selected = value ?? internalValue;
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  );
  const valueText = selected.from
    ? `${formatter.format(selected.from)}${selected.to ? ` – ${formatter.format(selected.to)}` : " – …"}`
    : undefined;

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      {fromName ? <input type="hidden" name={fromName} value={inputDate(selected.from)} /> : null}
      {toName ? <input type="hidden" name={toName} value={inputDate(selected.to)} /> : null}
      <DateFieldPopover
        {...fieldProps}
        label={label}
        placeholder={placeholder}
        valueText={valueText}
        ariaLabel={typeof label === "string" ? label : "Choose a date range"}
        onOpenChange={(next) => {
          if (next && closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          onOpenChange?.(next);
        }}
      >
        {({ close }) => (
          <Calendar
            variant="compact"
            selectionMode="range"
            range={selected}
            locale={locale}
            weekStartsOn={weekStartsOn}
            ariaLabel="Date range picker calendar"
            className="!max-w-none !rounded-none !border-0 !shadow-none"
            onRangeChange={(next) => {
              if (value === undefined) setInternalValue(next);
              onValueChange?.(next);
              if (closeOnComplete && next.from && next.to) {
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                closeTimerRef.current = setTimeout(() => {
                  closeTimerRef.current = null;
                  close();
                }, reduceMotion ? 0 : Math.round(motionTokens.duration.expand * 1000));
              }
            }}
          />
        )}
      </DateFieldPopover>
    </>
  );
}
