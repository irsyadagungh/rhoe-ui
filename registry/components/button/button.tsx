"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconMorph, type IconMorphPaths } from "../icon-morph/icon-morph";
import { motionTokens } from "../lib/motion-tokens";
import { MorphingText } from "../morphing-text/morphing-text";
import "../foundation.css";

export type ButtonVariant = "filled" | "bordered" | "text";
export type ButtonTone = "primary" | "secondary" | "success" | "warning" | "danger";
export type ButtonSize = "small" | "medium" | "large";

const baseClass = "inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-[18px] border font-[inherit] font-[650] leading-none no-underline transition-[opacity,background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] [webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-[0.48] aria-disabled:cursor-not-allowed aria-disabled:opacity-[0.48] active:not-disabled:translate-y-px";

const sizeClasses: Record<ButtonSize, string> = {
  small: "min-h-10 px-4 text-xs",
  medium: "min-h-[46px] px-5 text-[13px]",
  large: "min-h-[52px] px-6 text-sm",
};

const appearanceClasses: Record<ButtonVariant, Record<ButtonTone, string>> = {
  filled: {
    primary: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
    secondary: "border-transparent bg-[var(--surface-muted)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_82%,var(--text))]",
    success: "border-transparent bg-[var(--surface-muted)] text-[var(--success-surface-foreground)] hover:bg-[var(--success-surface)]",
    warning: "border-transparent bg-[var(--surface-muted)] text-[var(--warning-surface-foreground)] hover:bg-[var(--warning-surface)]",
    danger: "border-transparent bg-[var(--surface-muted)] text-[var(--danger-surface-foreground)] hover:bg-[var(--danger-surface)]",
  },
  bordered: {
    primary: "border-[color-mix(in_srgb,var(--text)_75%,transparent)] bg-[color-mix(in_srgb,var(--surface-muted)_75%,transparent)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[color-mix(in_srgb,var(--primary)_25%,transparent)]",
    secondary: "border-[color-mix(in_srgb,var(--text-secondary)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-muted)_75%,transparent)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
    success: "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_25%,transparent)] text-[var(--success-surface-foreground)] hover:border-[var(--success-surface-foreground)] hover:bg-[var(--success-surface)]",
    warning: "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_25%,transparent)] text-[var(--warning-surface-foreground)] hover:border-[var(--warning-surface-foreground)] hover:bg-[var(--warning-surface)]",
    danger: "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_25%,transparent)] text-[var(--danger-surface-foreground)] hover:border-[var(--danger-surface-foreground)] hover:bg-[var(--danger-surface)]",
  },
  text: {
    primary: "border-transparent bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)]",
    secondary: "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
    success: "border-transparent bg-transparent text-[var(--success-surface-foreground)] hover:bg-[var(--surface-muted)]",
    warning: "border-transparent bg-transparent text-[var(--warning-surface-foreground)] hover:bg-[var(--surface-muted)]",
    danger: "border-transparent bg-transparent text-[var(--danger-surface-foreground)] hover:bg-[var(--surface-muted)]",
  },
};

function classes(variant: ButtonVariant, tone: ButtonTone, size: ButtonSize, className?: string) {
  return [baseClass, sizeClasses[size], appearanceClasses[variant][tone], className]
    .filter(Boolean)
    .join(" ");
}

interface ButtonStyleProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

type OneOrMany<Value> = Value | readonly Value[];

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  variant?: ButtonVariant;
  tone?: OneOrMany<ButtonTone>;
  size?: ButtonSize;
  children?: ReactNode;
  label?: OneOrMany<string>;
  icon?: OneOrMany<ReactNode>;
  iconPosition?: "start" | "end";
  loading?: OneOrMany<boolean>;
  state?: number;
  iconPaths?: IconMorphPaths;
}

function atState<Value>(value: OneOrMany<Value> | undefined, state: number) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return value as Value;
  return value[Math.min(state, value.length - 1)];
}

function ButtonIcon({ icons, state, paths, spinning }: {
  icons: OneOrMany<ReactNode>;
  state: number;
  paths?: IconMorphPaths;
  spinning?: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const values = Array.isArray(icons) ? icons : [icons];
  const current = values[Math.min(state, values.length - 1)];

  if (paths && values.length === 2) {
    return <IconMorph state={state > 0} from={values[0]} to={values[1]} paths={paths} size={18} />;
  }

  return (
    <span className="relative inline-grid size-[18px] place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          className="absolute inset-0 grid origin-center place-items-center"
          key={state}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.62 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.62 }}
          transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
        >
          <motion.span
            className="grid place-items-center [&>svg]:size-[18px]"
            animate={{ rotate: spinning && !reduceMotion ? 360 : 0 }}
            transition={spinning && !reduceMotion
              ? { duration: 0.8, ease: "linear", repeat: Infinity }
              : { duration: 0 }}
          >
            {current}
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "filled",
  tone = "primary",
  size = "medium",
  label,
  icon,
  iconPosition = "start",
  loading = false,
  state = 0,
  iconPaths,
  className,
  children,
  type = "button",
  ...props
}, ref) {
  const activeState = Math.max(0, Math.floor(state));
  const activeTone = atState(tone, activeState) ?? "primary";
  const isLoading = atState(loading, activeState) ?? false;
  const activeIcon = icon
    ? <ButtonIcon icons={icon} state={activeState} paths={iconPaths} spinning={isLoading} />
    : undefined;
  const content = label === undefined
    ? children
    : <MorphingText value={atState(label, activeState) ?? ""} />;
  const iconOnly = activeIcon !== undefined && content == null;

  return (
    <button
      ref={ref}
      {...props}
      type={type}
      aria-busy={isLoading || undefined}
      className={classes(variant, activeTone, size, [
        iconOnly && { small: "w-10 px-0", medium: "w-[46px] px-0", large: "w-[52px] px-0" }[size],
        className,
      ].filter(Boolean).join(" "))}
    >
      {activeIcon && iconPosition === "start" ? <span className="grid shrink-0 place-items-center" aria-hidden="true">{activeIcon}</span> : null}
      {content}
      {activeIcon && iconPosition === "end" ? <span className="grid shrink-0 place-items-center" aria-hidden="true">{activeIcon}</span> : null}
    </button>
  );
});

export interface ButtonLinkProps extends ComponentPropsWithoutRef<"a">, ButtonStyleProps {
  icon?: ReactNode;
  iconPosition?: "start" | "end";
}

export function ButtonLink({
  variant = "filled",
  tone = "primary",
  size = "medium",
  icon,
  iconPosition = "start",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a {...props} className={classes(variant, tone, size, className)}>
      {icon && iconPosition === "start" ? <span className="grid shrink-0 place-items-center [&>svg]:size-[18px]" aria-hidden="true">{icon}</span> : null}
      {children}
      {icon && iconPosition === "end" ? <span className="grid shrink-0 place-items-center [&>svg]:size-[18px]" aria-hidden="true">{icon}</span> : null}
    </a>
  );
}
