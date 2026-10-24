"use client";

import { CircleUserRound, Layers, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { Select, type SelectItem, type SelectValue } from "@/registry/components/select/select";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";
import { PreviewSizeTabs } from "./size-tabs";

type SelectMode = "single" | "multiple";

const teamItems: SelectItem[] = [
  { value: "design", label: "Design", description: "Product and brand design", leading: <Sparkles /> },
  { value: "engineering", label: "Engineering", description: "Application development", leading: <Layers /> },
  { value: "support", label: "Support", description: "Customer experience", leading: <CircleUserRound /> },
  { value: "operations", label: "Operations", description: "Business operations", leading: <UserRound /> },
];

export function SelectSandbox() {
  const [mode, setMode] = useState<SelectMode>("single");
  const [searchable, setSearchable] = useState(true);
  const [value, setValue] = useState<SelectValue>("engineering");

  const changeMode = (nextMode: SelectMode) => {
    setMode(nextMode);
    setValue(nextMode === "multiple" ? ["design", "engineering"] : "engineering");
  };

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Select mode"
            value={mode}
            onValueChange={(nextMode) => changeMode(nextMode as SelectMode)}
            items={[
              { value: "single", label: "Single", content: <span /> },
              { value: "multiple", label: "Multiple", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Select search"
            value={searchable ? "search" : "no-search"}
            onValueChange={(nextValue) => setSearchable(nextValue === "search")}
            items={[
              { value: "search", label: "Searchable", content: <span /> },
              { value: "no-search", label: "No search", content: <span /> },
            ]}
          />
        </div>
      )}
    >
      <PreviewSizeTabs>
        {(size) => <div className="min-h-[380px] w-full max-w-[520px]">
          <Select
            label="Team"
            placeholder="Choose teams"
            items={teamItems}
            multiple={mode === "multiple"}
            searchable={searchable}
            size={size}
            value={value}
            onValueChange={setValue}
          />
        </div>}
      </PreviewSizeTabs>
    </PreviewCanvas>
  );
}
