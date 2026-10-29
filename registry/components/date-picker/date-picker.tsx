"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Calendar } from "../calendar/calendar";
import { DateFieldPopover } from "../lib/date-field-popover";
import { motionTokens } from "../lib/motion-tokens";

export interface DatePickerProps {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  label?: ReactNode;
  placeholder?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
  name?: string;
  disabled?: boolean;
  errorMessage?: ReactNode;
  variant?: "filled" | "bordered";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Calendar width relative to the field, or a custom width in pixels. */
  calendarWidth?: "full" | "three-quarter" | number;
}

function inputDate(date?: Date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  label,
  placeholder = "Choose a date",
  locale = "en-US",
  weekStartsOn = 0,
  name,
  onOpenChange,
  ...fieldProps
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const selected = value ?? internalValue;
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      {name ? <input type="hidden" name={name} value={inputDate(selected)} /> : null}
      <DateFieldPopover
        {...fieldProps}
        label={label}
        placeholder={placeholder}
        valueText={selected ? formatter.format(selected) : undefined}
        ariaLabel={typeof label === "string" ? label : "Choose a date"}
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
            value={selected}
            defaultValue={defaultValue}
            locale={locale}
            weekStartsOn={weekStartsOn}
            ariaLabel="Date picker calendar"
            showSelectedDate={false}
            className="!max-w-none !rounded-none !border-0 !bg-transparent !shadow-none"
            onValueChange={(date) => {
              if (value === undefined) setInternalValue(date);
              onValueChange?.(date);
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              closeTimerRef.current = setTimeout(() => {
                closeTimerRef.current = null;
                close();
              }, reduceMotion ? 0 : Math.round(motionTokens.spring.smooth.visualDuration * 1000));
            }}
          />
        )}
      </DateFieldPopover>
    </>
  );
}
