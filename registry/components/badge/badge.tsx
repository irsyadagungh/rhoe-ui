import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import "../foundation.css";

export type BadgeVariant = "filled" | "bordered";
export type BadgeTone = "neutral" | "success" | "warning" | "danger";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** Visual treatment for the status label. */
  variant?: BadgeVariant;
  /** Semantic status color. */
  tone?: BadgeTone;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Visible status or category label. */
  children: ReactNode;
  /** Overrides the label color with any CSS color value. */
  color?: CSSProperties["color"];
  /** Overrides the surface color with any CSS color value. */
  backgroundColor?: CSSProperties["backgroundColor"];
  /** Overrides the outline color for the bordered variant with any CSS color value. */
  borderColor?: CSSProperties["borderColor"];
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({
  variant = "filled",
  tone = "neutral",
  icon,
  color,
  backgroundColor,
  borderColor,
  className,
  style,
  children,
  ...props
}, ref) {
  const customColors = {
    ...style,
    "--badge-color": color,
    "--badge-background": backgroundColor,
    "--badge-border": variant === "bordered" ? borderColor : undefined,
  } as CSSProperties;

  return (
    <span
      ref={ref}
      {...props}
      className={[
        "inline-flex min-h-7 items-center justify-center gap-[5px] rounded-full border px-2.5 font-[inherit] text-[11px] font-bold leading-none tracking-[0.01em] align-middle whitespace-nowrap [background:var(--badge-background)] [border-color:var(--badge-border,transparent)] [color:var(--badge-color)]",
        variant === "filled" && "data-[tone=neutral]:[--badge-background:var(--surface-muted)] data-[tone=neutral]:[--badge-color:var(--text-secondary)] data-[tone=success]:[--badge-background:var(--success-surface)] data-[tone=success]:[--badge-color:var(--success-surface-foreground)] data-[tone=warning]:[--badge-background:var(--warning-surface)] data-[tone=warning]:[--badge-color:var(--warning-surface-foreground)] data-[tone=danger]:[--badge-background:var(--danger-surface)] data-[tone=danger]:[--badge-color:var(--danger-surface-foreground)]",
        variant === "bordered" && "data-[tone=neutral]:[--badge-background:color-mix(in_srgb,var(--surface-muted)_58%,transparent)] data-[tone=neutral]:[--badge-border:color-mix(in_srgb,var(--text-secondary)_46%,transparent)] data-[tone=neutral]:[--badge-color:var(--text-secondary)] data-[tone=success]:[--badge-background:color-mix(in_srgb,var(--success-surface)_68%,transparent)] data-[tone=success]:[--badge-border:color-mix(in_srgb,var(--success-surface-foreground)_52%,transparent)] data-[tone=success]:[--badge-color:var(--success-surface-foreground)] data-[tone=warning]:[--badge-background:color-mix(in_srgb,var(--warning-surface)_68%,transparent)] data-[tone=warning]:[--badge-border:color-mix(in_srgb,var(--warning-surface-foreground)_52%,transparent)] data-[tone=warning]:[--badge-color:var(--warning-surface-foreground)] data-[tone=danger]:[--badge-background:color-mix(in_srgb,var(--danger-surface)_68%,transparent)] data-[tone=danger]:[--badge-border:color-mix(in_srgb,var(--danger-surface-foreground)_52%,transparent)] data-[tone=danger]:[--badge-color:var(--danger-surface-foreground)]",
        className,
      ].filter(Boolean).join(" ")}
      data-tone={tone}
      style={customColors}
    >
      {icon ? <span className="grid shrink-0 place-items-center [&>svg]:size-[13px]" aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
});
