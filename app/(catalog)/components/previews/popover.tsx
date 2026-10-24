"use client";

import { useState } from "react";
import { Bell, SlidersHorizontal } from "lucide-react";
import { Popover, type PopoverTrigger, type PopoverVariant } from "@/registry/components/popover/popover";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function PopoverSandbox() {
  const [variant, setVariant] = useState<PopoverVariant>("filled");
  const [trigger, setTrigger] = useState<PopoverTrigger>("button");
  const [notifications, setNotifications] = useState(true);

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Popover trigger"
            value={trigger}
            onValueChange={(value) => setTrigger(value as PopoverTrigger)}
            items={[
              { value: "button", label: "Button", content: <span /> },
              { value: "tooltip", label: "Tooltip", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Popover surface"
            value={variant}
            onValueChange={(value) => setVariant(value as PopoverVariant)}
            items={[
              { value: "filled", label: "Filled", content: <span /> },
              { value: "bordered", label: "Bordered", content: <span /> },
            ]}
          />
        </div>
      )}
    >
      <div className="flex min-h-72 w-full items-start justify-center pt-8">
        <Popover
          ariaLabel="Notification settings"
          label="Preferences"
          icon={<SlidersHorizontal />}
          trigger={trigger}
          variant={variant}
        >
          <div className="w-72 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface)] text-[var(--text-secondary)]"><Bell size={17} /></span>
              <div><p className="text-sm font-semibold">Notifications</p><p className="mt-0.5 text-xs text-[var(--text-secondary)]">Choose what reaches your inbox.</p></div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-[var(--border)] pt-3 text-sm">
              Email updates
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) => setNotifications(event.target.checked)}
                className="size-4 accent-[var(--focus)]"
              />
            </label>
          </div>
        </Popover>
      </div>
    </PreviewCanvas>
  );
}
