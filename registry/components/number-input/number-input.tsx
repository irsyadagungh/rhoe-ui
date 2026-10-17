"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../button/button";
import { Input, type InputProps } from "../input/input";
import { RollingNumber, type RollingNumberProps } from "../rolling-number/rolling-number";
import { TextReveal } from "../text-reveal/text-reveal";
import "../foundation.css";

export interface NumberInputProps
  extends Omit<
    InputProps,
    "type" | "inputMode" | "value" | "defaultValue" | "onValueChange" | "suffixControl" | "suffixIcon" | "clearable" | "valueDisplay" | "externalTrailing" | "externalTrailingClassName"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  locale?: RollingNumberProps["locale"];
  format?: RollingNumberProps["format"];
  decrementLabel?: string;
  incrementLabel?: string;
  hoverable?: boolean;
  minError?: string;
  maxError?: string;
}

function stepPrecision(step: number) {
  const value = String(step).toLowerCase();
  if (value.includes("e-")) return Number(value.split("e-")[1] ?? 0);
  return value.split(".")[1]?.length ?? 0;
}

const minimumValidationDelay = 1000;

function isPartialNumber(value: string) {
  return value === "" || value === "-" || value === "." || value === "-.";
}

function isNumericDraft(value: string) {
  return /^-?\d*(?:\.\d*)?$/.test(value);
}

export function NumberInput({
  value,
  defaultValue = 0,
  onValueChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  locale,
  format,
  decrementLabel = "Decrease value",
  incrementLabel = "Increase value",
  hoverable = false,
  minError,
  maxError,
  disabled,
  variant = "filled",
  onKeyDown,
  error: inputError,
  ...inputProps
}: NumberInputProps) {
  const minValue = Number.isFinite(min) ? min : Number.MIN_SAFE_INTEGER;
  const maxValue = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
  const lowerBound = Math.min(minValue, maxValue);
  const upperBound = Math.max(minValue, maxValue);
  const [internalValue, setInternalValue] = useState(() => Math.min(upperBound, Math.max(lowerBound, defaultValue)));
  const [rangeError, setRangeError] = useState<"min" | "max" | null>(null);
  const [valueFeedbackKey, setValueFeedbackKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minimumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentValue = value ?? internalValue;
  const [draftValue, setDraftValue] = useState(() => String(value ?? Math.min(upperBound, Math.max(lowerBound, defaultValue))));
  const draftValueRef = useRef(draftValue);
  const currentValueRef = useRef(currentValue);
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const controlSize = inputProps.dense ? "small" : inputProps.size ?? "medium";
  const precision = stepPrecision(safeStep);
  const errorFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: Math.max(precision, 0) }),
    [locale, precision],
  );

  useEffect(() => {
    draftValueRef.current = draftValue;
  }, [draftValue]);

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (minimumTimerRef.current) clearTimeout(minimumTimerRef.current);
  }, []);

  const clearRangeError = () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setRangeError(null);
  };

  const clearMinimumValidation = () => {
    if (minimumTimerRef.current) {
      clearTimeout(minimumTimerRef.current);
      minimumTimerRef.current = null;
    }
  };

  const showRangeError = (nextError: "min" | "max") => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setRangeError(nextError);
    setValueFeedbackKey((current) => current + 1);
    errorTimerRef.current = setTimeout(() => {
      setRangeError(null);
      errorTimerRef.current = null;
    }, 3000);
  };

  const updateValue = (nextValue: number) => {
    const factor = 10 ** precision;
    const rounded = Math.round((nextValue + Number.EPSILON) * factor) / factor;
    if (rounded < lowerBound) {
      showRangeError("min");
      return null;
    }
    if (rounded > upperBound) {
      showRangeError("max");
      return null;
    }
    clearRangeError();
    if (rounded !== currentValue) {
      if (value === undefined) setInternalValue(rounded);
      onValueChange?.(rounded);
    }
    return rounded;
  };

  const stepValue = (nextValue: number) => {
    clearMinimumValidation();
    const next = updateValue(nextValue);
    if (next === null) return;
    setDraftValue(String(next));
    setIsEditing(false);
  };

  const scheduleMinimumValidation = (nextDraft: string) => {
    clearMinimumValidation();
    const parsed = Number(nextDraft);
    if (isPartialNumber(nextDraft) || !Number.isFinite(parsed) || parsed >= lowerBound) return;

    minimumTimerRef.current = setTimeout(() => {
      minimumTimerRef.current = null;
      if (draftValueRef.current !== nextDraft) return;
      showRangeError("min");
      setDraftValue(String(currentValueRef.current));
    }, minimumValidationDelay);
  };

  const commitDraft = () => {
    clearMinimumValidation();
    const nextDraft = draftValueRef.current;
    if (isPartialNumber(nextDraft)) {
      setDraftValue(String(currentValue));
      return;
    }

    const parsed = Number(nextDraft);
    if (!Number.isFinite(parsed)) {
      setDraftValue(String(currentValue));
      return;
    }
    if (parsed < lowerBound) {
      showRangeError("min");
      setDraftValue(String(currentValue));
      return;
    }
    if (parsed > upperBound) {
      showRangeError("max");
      setDraftValue(String(currentValue));
      return;
    }

    updateValue(parsed);
    setDraftValue(String(parsed));
  };

  const handleDraftChange = (nextDraft: string) => {
    if (!isNumericDraft(nextDraft)) return;
    clearMinimumValidation();

    if (isPartialNumber(nextDraft)) {
      clearRangeError();
      setDraftValue(nextDraft);
      return;
    }

    const parsed = Number(nextDraft);
    if (!Number.isFinite(parsed)) return;
    if (parsed > upperBound) {
      showRangeError("max");
      setDraftValue(String(currentValue));
      return;
    }

    clearRangeError();
    setDraftValue(nextDraft);
    if (parsed >= lowerBound) {
      updateValue(parsed);
    } else {
      scheduleMinimumValidation(nextDraft);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      stepValue(currentValue - safeStep);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      stepValue(currentValue + safeStep);
    }
    onKeyDown?.(event);
  };

  const stepControls = (controlVariant: "filled" | "bordered" | "text") => (
    <>
      <Button
        className="shrink-0 rounded-xl"
        variant={controlVariant}
        tone="secondary"
        size={controlSize}
        icon={<Minus />}
        aria-label={decrementLabel}
        disabled={disabled}
        onClick={() => stepValue(currentValue - safeStep)}
      />
      <Button
        className="shrink-0 rounded-xl"
        variant={controlVariant}
        tone="secondary"
        size={controlSize}
        icon={<Plus />}
        aria-label={incrementLabel}
        disabled={disabled}
        onClick={() => stepValue(currentValue + safeStep)}
      />
    </>
  );

  return (
      <Input
      {...inputProps}
      className={[
        "w-full [--number-input-control-size:46px] [--number-input-controls-width:96px] [&_.sya-number-controls]:w-max [&_.sya-number-controls_button]:size-[var(--number-input-control-size)] [&_.sya-number-controls_button]:min-h-[var(--number-input-control-size)] [&_.sya-number-controls_button]:min-w-[var(--number-input-control-size)] [&_.sya-number-controls_button]:rounded-[18px]",
        controlSize === "small" && "[--number-input-control-size:40px] [--number-input-controls-width:84px]",
        controlSize === "large" && "[--number-input-control-size:52px] [--number-input-controls-width:108px]",
        hoverable && "[--input-external-width:0px] [--input-external-gap:0px] hover:[--input-external-width:var(--number-input-controls-width)] hover:[--input-external-gap:4px] focus-within:[--input-external-width:var(--number-input-controls-width)] focus-within:[--input-external-gap:4px] [&:has(.sya-number-controls)>div]:duration-[560ms] [&:has(.sya-number-controls)>div]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_.sya-number-controls_button]:pointer-events-none [&_.sya-number-controls_button]:scale-[0.92] [&_.sya-number-controls_button]:opacity-0 [&_.sya-number-controls_button]:transition-[opacity,transform,background-color,border-color,color] [&_.sya-number-controls_button]:duration-[260ms,var(--duration-fast),var(--duration-fast),var(--duration-fast)] [&_.sya-number-controls_button]:ease-[cubic-bezier(0.16,1,0.3,1)] hover:[&_.sya-number-controls_button]:pointer-events-auto hover:[&_.sya-number-controls_button]:scale-100 hover:[&_.sya-number-controls_button]:opacity-100 focus-within:[&_.sya-number-controls_button]:pointer-events-auto focus-within:[&_.sya-number-controls_button]:scale-100 focus-within:[&_.sya-number-controls_button]:opacity-100 hover:[&_.sya-number-controls_button:first-child]:delay-[140ms] focus-within:[&_.sya-number-controls_button:first-child]:delay-[140ms] hover:[&_.sya-number-controls_button:last-child]:delay-[180ms] focus-within:[&_.sya-number-controls_button:last-child]:delay-[180ms] motion-reduce:[&_.sya-number-controls_button]:duration-[0.01ms]",
        inputProps.className,
      ].filter(Boolean).join(" ")}
      disabled={disabled}
      variant={variant}
      type="text"
      inputMode="decimal"
      role="spinbutton"
      aria-valuemin={lowerBound}
      aria-valuemax={upperBound}
      aria-valuenow={currentValue}
      value={isEditing ? draftValue : String(currentValue)}
      error={rangeError
        ? (
            <TextReveal by="line" key={valueFeedbackKey}>
              {rangeError === "min"
                ? (minError ?? `Value must be at least ${errorFormatter.format(lowerBound)}.`)
                : (maxError ?? `Value must be at most ${errorFormatter.format(upperBound)}.`)}
            </TextReveal>
          )
        : inputError}
      valueFeedbackKey={valueFeedbackKey}
      valueDisplay={!isEditing ? (
        <RollingNumber
          value={currentValue}
          locale={locale}
          format={{ useGrouping: false, maximumFractionDigits: Math.max(precision, 0), ...format }}
        />
      ) : undefined}
      clearable={false}
      suffixControl={hoverable ? undefined : stepControls("text")}
      externalTrailingClassName={hoverable ? "sya-number-controls" : undefined}
      externalTrailing={hoverable ? stepControls(variant) : undefined}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        setIsEditing(true);
        setDraftValue(String(currentValue));
        inputProps.onFocus?.(event);
      }}
      onBlur={(event) => {
        commitDraft();
        setIsEditing(false);
        inputProps.onBlur?.(event);
      }}
      onValueChange={(nextValue) => {
        handleDraftChange(nextValue);
      }}
    />
  );
}
