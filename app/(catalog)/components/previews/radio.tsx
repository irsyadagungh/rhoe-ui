"use client";

import { useState } from "react";
import { Radio, RadioList, type RadioListVariant } from "@/registry/components/radio/radio";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

type RadioPreviewVariant = "only" | "label" | "list";

const planItems = [
  { value: "starter", label: "Starter", description: "For personal projects and prototypes." },
  { value: "team", label: "Team", description: "For small teams shipping together." },
  { value: "business", label: "Business", description: "For larger workspaces with advanced controls." },
];

export function RadioSandbox() {
  const [variant, setVariant] = useState<RadioPreviewVariant>("only");
  const [checked, setChecked] = useState(true);
  const [plan, setPlan] = useState("team");
  const [listVariant, setListVariant] = useState<RadioListVariant>("default");

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Radio variant"
            value={variant}
            onValueChange={(value) => setVariant(value as RadioPreviewVariant)}
            items={[
              { value: "only", label: "Radio only", content: <span /> },
              { value: "label", label: "With label", content: <span /> },
              { value: "list", label: "Radio list", content: <span /> },
            ]}
          />
          {variant === "list" ? (
            <Tabs
              variant="flat"
              ariaLabel="Radio list variant"
              value={listVariant}
              onValueChange={(value) => setListVariant(value as RadioListVariant)}
              items={[
                { value: "default", label: "Default", content: <span /> },
                { value: "filled-leading", label: "Filled · Leading", content: <span /> },
                { value: "filled-trailing", label: "Filled · Trailing", content: <span /> },
                { value: "selected", label: "Selected list", content: <span /> },
              ]}
            />
          ) : null}
        </div>
      )}
    >
      <div className="grid min-h-56 place-items-center">
        {variant === "list" ? (
          <RadioList
            ariaLabel="Plan"
            items={planItems}
            value={plan}
            onValueChange={setPlan}
            variant={listVariant}
          />
        ) : (
          <Radio
            aria-label={variant === "only" ? "Select plan" : undefined}
            checked={checked}
            onCheckedChange={setChecked}
            label={variant === "label" ? "Select this plan" : undefined}
          />
        )}
      </div>
    </PreviewCanvas>
  );
}
