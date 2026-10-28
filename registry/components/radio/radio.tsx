"use client";

import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type RadioIndicatorPosition = "leading" | "trailing" | "none";
export type RadioListVariant = "default" | "filled-leading" | "filled-trailing" | "selected";

export interface RadioProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "size" | "checked" | "defaultChecked" | "onChange"
> {
  /** Controlled selected state. */
  checked?: boolean;
  /** Initial uncontrolled selected state. */
  defaultChecked?: boolean;
  /** Receives the next selected state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label associated with the radio. */
  label?: ReactNode;
  /** Optional supporting text below the label. */
  description?: ReactNode;
  /** Default compact radio or a filled list row. */
  variant?: "default" | "filled";
  /** Places the radio before or after its label. */
  indicatorPosition?: RadioIndicatorPosition;
}

export interface RadioListItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioListProps {
  /** Options rendered as semantic list items. */
  items: RadioListItem[];
  /** Controlled selected value. */
  value?: string;
  /** Initial uncontrolled selected value. */
  defaultValue?: string;
  /** Receives the next selected value. */
  onValueChange?: (value: string) => void;
  /** Accessible name for the list. */
  ariaLabel?: string;
  /** Name shared by all radio inputs. */
  name?: string;
  /** Visual treatment for every semantic list row. */
  variant?: RadioListVariant;
  /** Additional classes for the list. */
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  description,
  variant = "default",
  indicatorPosition = "leading",
  className,
  disabled,
  id,
  ...props
}, ref) {
  const reduceMotion = useReducedMotion() ?? false;
  const generatedId = useId();
  const inputId = id ?? `rhoe-radio-${generatedId}`;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? internalChecked;
  const isSelectedRow = variant === "filled" && indicatorPosition === "none" && isChecked;

  return (
    <label
      htmlFor={inputId}
      className={[
        "inline-flex cursor-pointer items-start gap-3 select-none",
        variant === "filled" ? "w-full rounded-[18px] bg-[var(--surface-muted)] px-4 py-3.5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_82%,var(--text))]" : "w-fit",
        indicatorPosition === "trailing" && "flex-row-reverse justify-between",
        indicatorPosition === "none" && "gap-0 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-[var(--focus)] has-[input:focus-visible]:outline-offset-3",
        isSelectedRow && "border !border-[var(--primary)] !bg-[var(--surface)] hover:!bg-[var(--surface)]",
        disabled && "cursor-not-allowed opacity-[0.48]",
      ].filter(Boolean).join(" ")}
    >
      <span className={indicatorPosition === "none"
        ? "contents"
        : variant === "filled"
          ? "relative inline-flex shrink-0 self-center"
          : "relative mt-0.5 inline-flex shrink-0"}>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="radio"
          className={["peer sr-only", className].filter(Boolean).join(" ")}
          checked={isChecked}
          disabled={disabled}
          onChange={(event) => {
            const nextChecked = event.currentTarget.checked;
            if (!isControlled) setInternalChecked(nextChecked);
            onCheckedChange?.(nextChecked);
          }}
        />
        {indicatorPosition !== "none" ? (
          <span
            className="grid size-5 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] transition-[background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] peer-checked:border-[var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)] peer-focus-visible:outline-offset-3"
            aria-hidden="true"
          >
            <AnimatePresence initial={false}>
              {isChecked ? (
                <motion.span
                  className="size-2.5 rounded-full bg-[var(--primary)]"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
                  transition={reduceMotion ? { duration: 0 } : motionTokens.spring.snappy}
                />
              ) : null}
            </AnimatePresence>
          </span>
        ) : null}
      </span>
      {label ? (
        <span className="min-w-0">
          <span className={`block text-sm leading-6 font-[560] ${isSelectedRow ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{label}</span>
          {description ? <span className={`mt-0.5 block text-[13px] leading-5 ${isSelectedRow ? "text-[color-mix(in_srgb,var(--primary)_76%,var(--text-secondary))]" : "text-[var(--text-secondary)]"}`}>{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
});

export function RadioList({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel = "Radio list",
  name,
  variant = "default",
  className,
}: RadioListProps) {
  const generatedName = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const radioVariant = variant === "default" ? "default" : "filled";
  const indicatorPosition: RadioIndicatorPosition = variant === "filled-trailing"
    ? "trailing"
    : variant === "selected"
      ? "none"
      : "leading";

  const select = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <ul className={["m-0 grid list-none gap-3 p-0", className].filter(Boolean).join(" ")} role="radiogroup" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.value}>
          <Radio
            name={name ?? `rhoe-radio-list-${generatedName}`}
            value={item.value}
            checked={selectedValue === item.value}
            disabled={item.disabled}
            label={item.label}
            description={item.description}
            variant={radioVariant}
            indicatorPosition={indicatorPosition}
            onCheckedChange={(checked) => {
              if (checked) select(item.value);
            }}
          />
        </li>
      ))}
    </ul>
  );
}
