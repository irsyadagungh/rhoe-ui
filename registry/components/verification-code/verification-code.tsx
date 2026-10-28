"use client";

import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface VerificationCodeProps
  extends Omit<ComponentPropsWithoutRef<"input">, "children" | "defaultValue" | "maxLength" | "onChange" | "size" | "type" | "value"> {
  length?: number;
  value?: string;
  defaultValue?: string;
  label?: ReactNode;
  hint?: string;
  error?: ReactNode;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

function digitsOnly(value: string, length: number) {
  return value.replace(/\D/g, "").slice(0, length);
}

export const VerificationCode = forwardRef<HTMLInputElement, VerificationCodeProps>(
  function VerificationCode({
    id,
    length = 6,
    value,
    defaultValue = "",
    label = "Verification code",
    hint,
    error,
    disabled,
    required,
    className,
    onValueChange,
    onComplete,
    onFocus,
    onBlur,
    ...props
  }, forwardedRef) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const inputRef = useRef<HTMLInputElement>(null);
    const safeLength = Math.max(1, Math.floor(length));
    const [internalValue, setInternalValue] = useState(() => digitsOnly(defaultValue, safeLength));
    const [focused, setFocused] = useState(false);
    const [caret, setCaret] = useState<number | null>(null);
    const reduceMotion = useReducedMotion() ?? false;
    const currentValue = digitsOnly(value ?? internalValue, safeLength);
    const activeIndex = Math.min(caret ?? currentValue.length, safeLength - 1);
    const describedBy = [props["aria-describedby"], error ? errorId : hint ? hintId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const updateValue = (nextValue: string) => {
      const normalized = digitsOnly(nextValue, safeLength);
      if (value === undefined) setInternalValue(normalized);
      onValueChange?.(normalized);
      if (normalized.length === safeLength && normalized !== currentValue) onComplete?.(normalized);
    };

    return (
      <div className={["w-full", className].filter(Boolean).join(" ")}>
        {label ? (
          <label className="mb-2 block text-sm font-[650] text-[var(--text)]" htmlFor={inputId}>
            {label}{required ? <span aria-hidden="true"> *</span> : null}
          </label>
        ) : null}

        <div
          className="relative grid w-full max-w-[25rem] grid-cols-[repeat(var(--verification-code-length),minmax(0,1fr))] gap-2"
          style={{ "--verification-code-length": safeLength } as CSSProperties}
          onClick={() => inputRef.current?.focus()}
        >
          <input
            {...props}
            ref={inputRef}
            id={inputId}
            className="absolute inset-0 z-10 size-full cursor-text opacity-0 disabled:cursor-not-allowed"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`[0-9]{${safeLength}}`}
            maxLength={safeLength}
            value={currentValue}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={error ? true : props["aria-invalid"]}
            onChange={(event) => { updateValue(event.currentTarget.value); setCaret(event.currentTarget.selectionStart); }}
            onSelect={(event) => { setCaret(event.currentTarget.selectionStart); props.onSelect?.(event); }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
          />

          {Array.from({ length: safeLength }, (_, index) => {
            const digit = currentValue[index];
            const active = focused && index === activeIndex;
            return (
              <motion.span
                aria-hidden="true"
                className={[
                  "relative grid aspect-square min-h-12 min-w-0 place-items-center overflow-hidden rounded-[18px] border text-xl font-[650] tabular-nums text-[var(--text)] transition-[border-color,background-color] duration-[var(--duration-standard)] ease-[var(--ease-standard)]",
                  active
                    ? "border-[var(--focus)] bg-[color-mix(in_srgb,var(--surface-muted)_78%,var(--primary))]"
                    : error
                      ? "border-[var(--danger-surface-foreground)] bg-[var(--surface-muted)]"
                      : "border-[var(--border)] bg-[var(--surface-muted)]",
                  disabled ? "opacity-[0.48]" : "",
                ].filter(Boolean).join(" ")}
                key={index}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {digit ? (
                    <motion.span
                      key={digit}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 7, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -7, filter: "blur(3px)" }}
                      transition={reduceMotion ? { duration: 0 } : {
                        duration: motionTokens.duration.standard,
                        ease: motionTokens.ease.standard,
                      }}
                    >
                      {digit}
                    </motion.span>
                  ) : active ? (
                    <motion.span
                      className="h-5 w-px bg-[var(--text)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 1.1, repeat: Infinity, times: [0, 0.1, 0.55, 1] }}
                    />
                  ) : null}
                </AnimatePresence>
              </motion.span>
            );
          })}
        </div>

        {error ? (
          <p className="mt-2 text-xs leading-5 text-[var(--danger-surface-foreground)]" id={errorId} role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]" id={hintId}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
