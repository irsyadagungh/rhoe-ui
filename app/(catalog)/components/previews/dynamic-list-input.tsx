"use client";
import { useState } from "react";
import { DynamicListInput } from "@/registry/components/dynamic-list-input/dynamic-list-input";

export function DynamicListInputExample({
  actionPlacement = "outside",
  variant = "filled",
}: {
  actionPlacement?: "inside" | "outside";
  variant?: "filled" | "bordered";
}) {
  const [items, setItems] = useState(["Design", "Development"]);
  return (
    <div className="mx-auto w-full max-w-md p-6">
      <DynamicListInput
        actionPlacement={actionPlacement}
        variant={variant}
        label="Project tasks"
        placeholder="Task"
        hint="Press Enter or use the plus button to add an item."
        value={items}
        onValueChange={setItems}
      />
    </div>
  );
}
