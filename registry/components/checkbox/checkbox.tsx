"use client";

import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type CheckboxIndicatorPosition = "leading" | "trailing" | "none";
export type CheckboxListVariant = "default" | "filled-leading" | "filled-trailing" | "selected";

export interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "size" | "checked" | "defaultChecked" | "onChange"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial uncontrolled checked state. */
  defaultChecked?: boolean;
  /** Receives the next checked state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label associated with the checkbox. */
  label?: ReactNode;
  /** Optional supporting text below the label. */
  description?: ReactNode;
  /** Default compact checkbox or a filled list row. */
  variant?: "default" | "filled";
  /** Places the checkbox before or after its label. */
  indicatorPosition?: CheckboxIndicatorPosition;
}

export interface CheckboxListItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface CheckboxListProps {
  /** Options rendered as semantic list items. */
  items: CheckboxListItem[];
  /** Controlled checked values. */
  value?: string[];
  /** Initial uncontrolled checked values. */
  defaultValue?: string[];
  /** Receives the next set of checked values. */
  onValueChange?: (value: string[]) => void;
  /** Accessible name for the list. */
  ariaLabel?: string;
  /** Name shared by all checkbox inputs. */
  name?: string;
  /** Visual treatment for every semantic list row. */
  variant?: CheckboxListVariant;
  /** Additional classes for the list. */
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({
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
  const inputId = id ?? `rhoe-checkbox-${generatedId}`;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? internalChecked;

  return (
    <label
      htmlFor={inputId}
      className={[
        "inline-flex cursor-pointer items-start gap-3 select-none",
        variant === "filled" ? "w-full rounded-[18px] bg-[var(--surface-muted)] px-4 py-3.5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_82%,var(--text))]" : "w-fit",
        indicatorPosition === "trailing" && "flex-row-reverse justify-between",
        indicatorPosition === "none" && "gap-0 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-[var(--focus)] has-[input:focus-visible]:outline-offset-3",
        variant === "filled" && indicatorPosition === "none" && isChecked && "border !border-[var(--primary)] !bg-[var(--surface)] hover:!bg-[var(--surface)]",
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
          type="checkbox"
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
            className="grid size-5 place-items-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[var(--primary-foreground)] transition-[background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)] peer-focus-visible:outline-offset-3"
            aria-hidden="true"
          >
            <AnimatePresence initial={false}>
              {isChecked ? (
                <motion.span
                  className="grid place-items-center [&>svg]:size-[14px]"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.55 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.55 }}
                  transition={reduceMotion ? { duration: 0 } : motionTokens.spring.snappy}
                >
                  <Check />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        ) : null}
      </span>
      {label ? (
        <span className="min-w-0">
          <span className={`block text-sm leading-6 font-[560] ${variant === "filled" && indicatorPosition === "none" && isChecked ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{label}</span>
          {description ? <span className={`mt-0.5 block text-[13px] leading-5 ${variant === "filled" && indicatorPosition === "none" && isChecked ? "text-[color-mix(in_srgb,var(--primary)_76%,var(--text-secondary))]" : "text-[var(--text-secondary)]"}`}>{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
});

export function CheckboxList({
  items,
  value,
  defaultValue = [],
  onValueChange,
  ariaLabel = "Checkbox list",
  name,
  variant = "default",
  className,
}: CheckboxListProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValues = value ?? internalValue;
  const checkboxVariant = variant === "default" ? "default" : "filled";
  const indicatorPosition: CheckboxIndicatorPosition = variant === "filled-trailing"
    ? "trailing"
    : variant === "selected"
      ? "none"
      : "leading";

  const setItemChecked = (itemValue: string, checked: boolean) => {
    const nextValue = checked
      ? [...new Set([...selectedValues, itemValue])]
      : selectedValues.filter((selectedValue) => selectedValue !== itemValue);
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <ul className={["m-0 grid list-none gap-3 p-0", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.value}>
          <Checkbox
            name={name}
            value={item.value}
            checked={selectedValues.includes(item.value)}
            disabled={item.disabled}
            label={item.label}
            description={item.description}
            variant={checkboxVariant}
            indicatorPosition={indicatorPosition}
            onCheckedChange={(checked) => setItemChecked(item.value, checked)}
          />
        </li>
      ))}
    </ul>
  );
}
