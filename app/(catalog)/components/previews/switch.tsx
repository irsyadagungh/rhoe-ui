"use client";

import { useState } from "react";
import { Switch, type SwitchLabelPosition } from "@/registry/components/switch/switch";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

type SwitchPreviewVariant = "only" | "label";

export function SwitchSandbox() {
  const [variant, setVariant] = useState<SwitchPreviewVariant>("only");
  const [labelPosition, setLabelPosition] = useState<SwitchLabelPosition>("right");
  const [checked, setChecked] = useState(true);

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Switch variant"
            value={variant}
            onValueChange={(value) => setVariant(value as SwitchPreviewVariant)}
            items={[
              { value: "only", label: "Only switch", content: <span /> },
              { value: "label", label: "With label", content: <span /> },
            ]}
          />
          {variant === "label" ? (
            <Tabs
              variant="flat"
              ariaLabel="Switch label position"
              value={labelPosition}
              onValueChange={(value) => setLabelPosition(value as SwitchLabelPosition)}
              items={[
                { value: "left", label: "Left", content: <span /> },
                { value: "right", label: "Right", content: <span /> },
                { value: "bottom", label: "Bottom", content: <span /> },
              ]}
            />
          ) : null}
        </div>
      )}
    >
      <div className="grid min-h-52 place-items-center">
        <Switch
          aria-label={variant === "only" ? "Enable notifications" : undefined}
          checked={checked}
          onCheckedChange={setChecked}
          label={variant === "label" ? "Enable notifications" : undefined}
          labelPosition={labelPosition}
        />
      </div>
    </PreviewCanvas>
  );
}
