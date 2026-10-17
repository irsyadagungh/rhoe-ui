"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { Input, type InputProps } from "../input/input";
import "../foundation.css";

export interface PasswordStrengthProps
  extends Omit<InputProps, "type" | "minLength" | "showPasswordToggle"> {
  minimumLength?: number;
}

const levelLabels = ["No password", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrength({
  value,
  defaultValue = "",
  onValueChange,
  minimumLength = 8,
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: PasswordStrengthProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const descriptionId = `${useId()}-strength`;
  const password = value ?? internalValue;
  const requirements = [
    { label: `At least ${minimumLength} characters`, met: password.length >= minimumLength },
    { label: "Contains an uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a symbol", met: /[^A-Za-z0-9\s]/.test(password) },
  ];
  const passed = requirements.filter((requirement) => requirement.met).length;
  const percentage = passed * 25;
  const level = password ? levelLabels[passed] : levelLabels[0];
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ");

  const updateValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div className="group grid w-full gap-3" data-level={password ? passed : 0}>
      <Input
        {...inputProps}
        type="password"
        minLength={minimumLength}
        showPasswordToggle
        value={password}
        onValueChange={updateValue}
        aria-describedby={describedBy}
      />

      <div className="grid gap-2.5" id={descriptionId}>
        <div className="flex items-center justify-between text-xs leading-[1.4] font-[620] text-[var(--text-secondary)] [&>span:last-child]:tabular-nums" aria-live="polite">
          <span>{level}</span>
          <span>{percentage}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
          role="progressbar"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-valuetext={`${level}, ${percentage}%`}
        >
          <span className="block h-full rounded-[inherit] bg-[var(--text-secondary)] transition-[width,background-color] duration-[420ms,220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-[0.01ms] group-data-[level=1]:bg-[var(--danger-surface-foreground)] group-data-[level=2]:bg-[var(--warning-surface-foreground)] group-data-[level=3]:bg-[var(--success-surface-foreground)] group-data-[level=4]:bg-[var(--success-surface-foreground)]" style={{ width: `${percentage}%` }} />
        </div>

        <ul className="m-0 mt-0.5 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0 max-[520px]:grid-cols-1" aria-label="Password requirements">
          {requirements.map((requirement) => (
            <li className={["flex min-w-0 items-center gap-[7px] text-xs leading-[1.45] text-[var(--text-secondary)] transition-colors duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-[0.01ms]", requirement.met && "text-[var(--success-surface-foreground)] [&>span]:bg-[var(--success-surface)]"].filter(Boolean).join(" ")} key={requirement.label}>
              <span className="grid size-4 shrink-0 place-items-center rounded-md bg-[var(--surface-muted)] transition-colors duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-[0.01ms] [&>svg]:size-[11px] [&>svg]:stroke-[2.25]" aria-hidden="true">
                {requirement.met ? <Check /> : <X />}
              </span>
              {requirement.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
