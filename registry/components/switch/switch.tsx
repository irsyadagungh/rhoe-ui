"use client";

import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type SwitchLabelPosition = "left" | "right" | "bottom";

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "size" | "checked" | "defaultChecked" | "onChange"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial uncontrolled checked state. */
  defaultChecked?: boolean;
  /** Receives the next checked state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label associated with the switch. */
  label?: ReactNode;
  /** Placement for the visible label. */
  labelPosition?: SwitchLabelPosition;
}

const labelPositionClasses: Record<SwitchLabelPosition, string> = {
  left: "flex-row-reverse justify-end",
  right: "flex-row justify-start",
  bottom: "flex-col items-start",
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelPosition = "right",
  className,
  disabled,
  id,
  ...props
}, ref) {
  const reduceMotion = useReducedMotion() ?? false;
  const generatedId = useId();
  const inputId = id ?? `rhoe-switch-${generatedId}`;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? internalChecked;

  return (
    <label
      htmlFor={inputId}
      className={[
        "inline-flex w-fit cursor-pointer gap-3 select-none",
        labelPositionClasses[labelPosition],
        disabled && "cursor-not-allowed opacity-[0.48]",
      ].filter(Boolean).join(" ")}
    >
      <span className="relative inline-flex shrink-0">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          className={["peer sr-only", className].filter(Boolean).join(" ")}
          checked={isChecked}
          disabled={disabled}
          onChange={(event) => {
            const nextChecked = event.currentTarget.checked;
            if (!isControlled) setInternalChecked(nextChecked);
            onCheckedChange?.(nextChecked);
          }}
        />
        <span
          className="relative flex h-7 w-[46px] items-center rounded-full border border-transparent bg-[var(--surface-muted)] p-[3px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--border)_80%,transparent)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] peer-checked:bg-[var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)] peer-focus-visible:outline-offset-3 peer-disabled:cursor-not-allowed"
          aria-hidden="true"
        >
          <motion.span
            className="relative z-[1] grid size-5 place-items-center rounded-full bg-[var(--primary-foreground)] shadow-[0_1px_2px_rgb(0_0_0_/_20%)]"
            initial={false}
            animate={{ x: isChecked ? 18 : 0 }}
            transition={reduceMotion ? { duration: 0 } : motionTokens.spring.snappy}
          />
        </span>
      </span>
      {label ? <span className="min-w-0 text-sm leading-7 font-[560] text-[var(--text)]">{label}</span> : null}
    </label>
  );
});
