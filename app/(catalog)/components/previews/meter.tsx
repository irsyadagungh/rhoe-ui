"use client";

import { useState } from "react";
import {
  Meter,
  type MeterVariant,
  type MeterSize,
  type MeterTone,
} from "@/registry/components/meter/meter";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function MeterExample({
  variant = "linear",
  size = "m",
}: {
  variant?: MeterVariant;
  size?: MeterSize;
}) {
  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6">
      <Meter
        variant={variant}
        size={size}
        value={78}
        tone="auto"
        label="Storage capacity"
        valueText="78 GB of 100 GB"
      />
    </div>
  );
}

export function MeterSandbox() {
  const [variant, setVariant] = useState<MeterVariant>("linear");
  const [size, setSize] = useState<MeterSize>("m");
  const [tone, setTone] = useState<MeterTone>("auto");
  const [labelPosition, setLabelPosition] = useState<"top" | "inside">("top");
  const [value, setValue] = useState<number>(76);

  // Dynamic label based on thresholds to demonstrate MorphingText
  const dynamicStatusLabel =
    value >= 90
      ? "Critical Storage Limit"
      : value >= 75
      ? "Warning Storage Limit"
      : "Standard Storage Capacity";

  return (
    <PreviewCanvas
      showReplay={true}
      toolbar={(
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Tabs
            variant="flat"
            ariaLabel="Meter variant"
            value={variant}
            onValueChange={(val) => setVariant(val as MeterVariant)}
            items={[
              { value: "linear", label: "Linear", content: <span /> },
              { value: "circle", label: "Circle", content: <span /> },
            ]}
          />

          <Tabs
            variant="flat"
            ariaLabel="Meter size"
            value={size}
            onValueChange={(val) => setSize(val as MeterSize)}
            items={[
              { value: "2xs", label: "2XS (6px · Progress)", content: <span /> },
              { value: "xs", label: "XS (32px)", content: <span /> },
              { value: "s", label: "S (40px)", content: <span /> },
              { value: "m", label: "M (46px)", content: <span /> },
              { value: "lg", label: "LG (52px)", content: <span /> },
              { value: "xl", label: "XL (60px)", content: <span /> },
            ]}
          />

          <Tabs
            variant="flat"
            ariaLabel="Meter tone"
            value={tone}
            onValueChange={(val) => setTone(val as MeterTone)}
            items={[
              { value: "auto", label: "Auto Threshold", content: <span /> },
              { value: "primary", label: "Primary", content: <span /> },
              { value: "success", label: "Success", content: <span /> },
              { value: "warning", label: "Warning", content: <span /> },
              { value: "danger", label: "Danger", content: <span /> },
            ]}
          />

          {variant === "linear" && size !== "2xs" && (
            <Tabs
              variant="flat"
              ariaLabel="Label position"
              value={labelPosition}
              onValueChange={(val) => setLabelPosition(val as "top" | "inside")}
              items={[
                { value: "top", label: "Top Header", content: <span /> },
                { value: "inside", label: "Inside Capsule", content: <span /> },
              ]}
            />
          )}

          {/* Value Slider with Jump Buttons */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-[620]">
            <span>Value:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-20 accent-[var(--primary)] cursor-pointer"
            />
            <span className="tabular-nums font-semibold w-9 text-[var(--text)]">{value}%</span>
            <div className="flex items-center gap-1 ml-1">
              {[35, 78, 94].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setValue(target)}
                  className={[
                    "px-1.5 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer",
                    value === target
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text)]",
                  ].join(" ")}
                >
                  {target}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    >
      <div className="grid min-h-64 place-items-center w-full max-w-xl mx-auto p-6">
        <div className="w-full flex flex-col items-center justify-center gap-8">
          {/* Main sandbox preview */}
          <div className="w-full flex flex-col items-center justify-center">
            {variant === "linear" ? (
              <div className="w-full max-w-md">
                <Meter
                  variant="linear"
                  size={size}
                  tone={tone}
                  value={value}
                  label={dynamicStatusLabel}
                  labelPosition={labelPosition}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Meter
                  variant="circle"
                  size={size}
                  tone={tone}
                  value={value}
                  label={dynamicStatusLabel}
                />
                <span className="text-xs text-[var(--text-secondary)] font-[620]">
                  {dynamicStatusLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PreviewCanvas>
  );
}
