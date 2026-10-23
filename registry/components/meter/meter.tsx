"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { RollingNumber } from "../rolling-number/rolling-number";
import { MorphingText } from "../morphing-text/morphing-text";
import "../foundation.css";

export type MeterVariant = "linear" | "circle";
export type MeterTone = "auto" | "primary" | "secondary" | "success" | "warning" | "danger";
export type MeterSize = "2xs" | "xs" | "s" | "m" | "lg" | "xl";

export interface MeterProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Visual form factor: horizontal bar ("linear") or radial gauge ("circle") */
  variant?: MeterVariant;
  /** Current value */
  value: number;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /**
   * Thickness / scale token:
   * - 2xs: hairline progress bar (6px / h-1.5)
   * - xs: compact capsule (32px)
   * - s: button small height (40px)
   * - m: button medium height (46px)
   * - lg: button large height (52px)
   * - xl: generous hero (60px)
   */
  size?: MeterSize;
  /**
   * Color tone for the usage bar.
   * If "auto", switches dynamically to warning (>=75%) or danger (>=90%).
   */
  tone?: MeterTone;
  /** Optional descriptive label */
  label?: ReactNode;
  /** Optional formatted value display (e.g. "42 GB / 100 GB" or "42%") */
  valueText?: ReactNode;
  /** Placement of label and value for linear variant (ignored on 2xs) */
  labelPosition?: "top" | "inside";
  /** Whether to render default percentage inside the meter when no children are provided */
  showValue?: boolean;
  /** Custom inner content (e.g. centered icon or custom formatted text) */
  children?: ReactNode | ((props: { value: number; percentage: number }) => ReactNode);
  /** Optional custom class for the background track/rail */
  railClassName?: string;
  /** Optional custom class for the filled indicator/usage */
  usageClassName?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Accessible description */
  "aria-valuetext"?: string;
}

const linearSizeMap: Record<MeterSize, { height: string; radius: string; padding: string; text: string }> = {
  "2xs": { height: "h-1.5", radius: "rounded-full", padding: "px-0", text: "text-[10px]" },
  xs: { height: "h-8", radius: "rounded-[14px]", padding: "px-3", text: "text-xs" },
  s: { height: "h-10", radius: "rounded-[18px]", padding: "px-3.5", text: "text-xs" },
  m: { height: "h-[46px]", radius: "rounded-[18px]", padding: "px-4", text: "text-[13px]" },
  lg: { height: "h-[52px]", radius: "rounded-[18px]", padding: "px-4.5", text: "text-sm" },
  xl: { height: "h-[60px]", radius: "rounded-[20px]", padding: "px-5", text: "text-base" },
};

const circleSizeMap: Record<MeterSize, { diameter: number; strokeWidth: number; text: string }> = {
  "2xs": { diameter: 20, strokeWidth: 2.5, text: "text-[9px]" },
  xs: { diameter: 32, strokeWidth: 3.5, text: "text-[10px]" },
  s: { diameter: 40, strokeWidth: 4, text: "text-xs" },
  m: { diameter: 46, strokeWidth: 4.5, text: "text-xs" },
  lg: { diameter: 52, strokeWidth: 5, text: "text-sm" },
  xl: { diameter: 60, strokeWidth: 6, text: "text-base" },
};

const toneUsageBgClasses: Record<Exclude<MeterTone, "auto">, string> = {
  primary: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  secondary: "bg-[var(--text-secondary)] text-[var(--surface)]",
  success: "bg-[var(--success)] text-[var(--success-foreground)]",
  warning: "bg-[var(--warning)] text-[var(--warning-foreground)]",
  danger: "bg-[var(--danger)] text-[var(--danger-foreground)]",
};

const toneStrokeColors: Record<Exclude<MeterTone, "auto">, string> = {
  primary: "var(--primary)",
  secondary: "var(--text-secondary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const toneForegroundClasses: Record<Exclude<MeterTone, "auto">, string> = {
  primary: "text-[var(--primary-foreground)]",
  secondary: "text-[var(--surface)]",
  success: "text-[var(--success-foreground)]",
  warning: "text-[var(--warning-foreground)]",
  danger: "text-[var(--danger-foreground)]",
};

function resolveTone(tone: MeterTone, percentage: number): Exclude<MeterTone, "auto"> {
  if (tone !== "auto") return tone;
  if (percentage >= 90) return "danger";
  if (percentage >= 75) return "warning";
  return "primary";
}

function renderTextWithMorph(content: ReactNode): ReactNode {
  if (typeof content === "string") {
    return <MorphingText value={content} />;
  }
  return content;
}

export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    variant = "linear",
    value,
    min = 0,
    max = 100,
    size = "m",
    tone = "primary",
    label,
    valueText,
    labelPosition = "top",
    showValue = true,
    children,
    className = "",
    railClassName = "",
    usageClassName = "",
    "aria-label": ariaLabel,
    "aria-valuetext": ariaValueText,
    ...props
  },
  ref
) {
  const reducedMotion = useReducedMotion();
  const [mountedValue, setMountedValue] = useState(0);

  useEffect(() => {
    setMountedValue(value);
  }, [value]);

  // Clamp percentage between 0 and 100
  const range = Math.max(max - min, 0.0001);
  const percentage = ((value - min) / range) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const roundedIntPercentage = Math.round(clampedPercentage);
  const activeTone = resolveTone(tone, clampedPercentage);

  // Counter percentage animated from 0 on initial mount
  const animatedCounterPercentage = Math.round(
    Math.min(100, Math.max(0, ((mountedValue - min) / range) * 100))
  );

  const defaultFormattedValue = `${roundedIntPercentage}%`;
  const defaultAnimatedPercentage = (
    <span className="inline-flex items-center tabular-nums">
      <RollingNumber value={animatedCounterPercentage} />
      <span>%</span>
    </span>
  );

  const renderedValueText = valueText ?? (showValue ? defaultAnimatedPercentage : null);

  const easeInOutTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const };

  const innerContent =
    typeof children === "function"
      ? children({ value, percentage: clampedPercentage })
      : children;

  // Render Circle Variant
  if (variant === "circle") {
    const isMicro = size === "2xs";
    const config = circleSizeMap[size];
    const { diameter, strokeWidth, text: textSizeClass } = config;
    const radius = (diameter - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (clampedPercentage / 100) * circumference;
    const strokeColor = toneStrokeColors[activeTone];

    return (
      <div
        ref={ref}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={ariaValueText ?? defaultFormattedValue}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        className={[
          "relative inline-flex items-center justify-center select-none font-[650]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width: diameter, height: diameter }}
        {...props}
      >
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          className="rotate-[-90deg] overflow-visible"
        >
          {/* Rail (Track) */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth={strokeWidth}
            className={railClassName}
          />
          {/* Usage (Indicator) */}
          <motion.circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={easeInOutTransition}
            className={usageClassName}
          />
        </svg>

        {/* Center Content (hidden on 2xs micro-gauge unless custom children are passed) */}
        {!isMicro && (
          <div
            className={[
              "absolute inset-0 flex items-center justify-center tabular-nums text-[var(--text)]",
              textSizeClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {innerContent ?? (showValue ? defaultAnimatedPercentage : null)}
          </div>
        )}
      </div>
    );
  }

  // Render Linear Variant
  const isHairline = size === "2xs";
  const linearConfig = linearSizeMap[size];
  const { height, radius, padding, text: textSizeClass } = linearConfig;
  const usageBgClass = toneUsageBgClasses[activeTone];
  const isInside = !isHairline && labelPosition === "inside";

  return (
    <div
      ref={ref}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={ariaValueText ?? defaultFormattedValue}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      className={["w-full flex flex-col gap-2 font-[650]", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {/* Optional Top Label Header */}
      {(!isInside || isHairline) && (label || renderedValueText) && (
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-[620]">
          {label && <span className="text-[var(--text)]">{renderTextWithMorph(label)}</span>}
          {renderedValueText && <span className="tabular-nums ml-auto">{renderedValueText}</span>}
        </div>
      )}

      {/* Rail (Track Capsule) */}
      <div
        className={[
          "relative w-full overflow-hidden bg-[var(--surface-muted)] select-none",
          isHairline ? "border-0" : "border border-[var(--border)]",
          height,
          radius,
          railClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Usage (Fill Bar) */}
        <motion.div
          className={[
            "absolute inset-y-0 left-0 rounded-[inherit]",
            usageBgClass,
            usageClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          initial={{ width: "0%" }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={easeInOutTransition}
        />

        {/* Inside Content / Inside Labels (only on capsule sizes, never on 2xs hairline) */}
        {!isHairline && (isInside || innerContent) && (
          <>
            {/* Layer 1: Base Rail Text (visible over un-filled rail) */}
            <div
              aria-hidden="true"
              className={[
                "relative z-10 flex h-full items-center justify-between pointer-events-none tabular-nums text-[var(--text)]",
                padding,
                textSizeClass,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {innerContent ? (
                <div className="w-full">{innerContent}</div>
              ) : (
                <>
                  <span className="font-[650]">{renderTextWithMorph(label)}</span>
                  <span className="font-[650] ml-auto">{renderedValueText}</span>
                </>
              )}
            </div>

            {/* Layer 2: Inverted Usage Text (clipped precisely to the animated fill bar) */}
            <motion.div
              aria-hidden="true"
              className={[
                "absolute inset-0 z-20 flex h-full items-center justify-between pointer-events-none tabular-nums",
                padding,
                textSizeClass,
                toneForegroundClasses[activeTone],
              ]
                .filter(Boolean)
                .join(" ")}
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: `inset(0 ${100 - clampedPercentage}% 0 0)` }}
              transition={easeInOutTransition}
            >
              {innerContent ? (
                <div className="w-full">{innerContent}</div>
              ) : (
                <>
                  <span className="font-[650]">{renderTextWithMorph(label)}</span>
                  <span className="font-[650] ml-auto">{renderedValueText}</span>
                </>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
});
