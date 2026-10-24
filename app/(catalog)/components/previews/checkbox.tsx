"use client";

import { useState } from "react";
import { Checkbox, CheckboxList, type CheckboxListVariant } from "@/registry/components/checkbox/checkbox";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

type CheckboxPreviewVariant = "only" | "label" | "list";

const notificationItems = [
  { value: "mentions", label: "Mentions", description: "Receive updates when someone mentions you." },
  { value: "replies", label: "Replies", description: "Receive updates for thread replies." },
  { value: "product", label: "Product updates", description: "Receive occasional product announcements." },
];

export function CheckboxSandbox() {
  const [variant, setVariant] = useState<CheckboxPreviewVariant>("only");
  const [checked, setChecked] = useState(true);
  const [notifications, setNotifications] = useState(["mentions", "replies"]);
  const [listVariant, setListVariant] = useState<CheckboxListVariant>("default");

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Checkbox variant"
            value={variant}
            onValueChange={(value) => setVariant(value as CheckboxPreviewVariant)}
            items={[
              { value: "only", label: "Checkbox only", content: <span /> },
              { value: "label", label: "With label", content: <span /> },
              { value: "list", label: "Checkbox list", content: <span /> },
            ]}
          />
          {variant === "list" ? (
            <Tabs
              variant="flat"
              ariaLabel="Checkbox list variant"
              value={listVariant}
              onValueChange={(value) => setListVariant(value as CheckboxListVariant)}
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
          <CheckboxList
            ariaLabel="Notifications"
            items={notificationItems}
            value={notifications}
            onValueChange={setNotifications}
            variant={listVariant}
          />
        ) : (
          <Checkbox
            aria-label={variant === "only" ? "Enable notifications" : undefined}
            checked={checked}
            onCheckedChange={setChecked}
            label={variant === "label" ? "Enable notifications" : undefined}
          />
        )}
      </div>
    </PreviewCanvas>
  );
}
