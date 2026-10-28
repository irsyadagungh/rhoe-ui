"use client";

import { useState } from "react";
import { Bell, CreditCard, Shield, UserRound } from "lucide-react";
import { AppDrawer } from "@/registry/components/app-drawer/app-drawer";
import { Button } from "@/registry/components/button/button";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

const items = [
  { icon: UserRound, label: "Profile", detail: "Name, email, and avatar" },
  { icon: Bell, label: "Notifications", detail: "Alerts and delivery settings" },
  { icon: Shield, label: "Security", detail: "Password and active sessions" },
  { icon: CreditCard, label: "Billing", detail: "Plan and payment methods" },
];

export function AppDrawerSandbox() {
  const [side, setSide] = useState<"left" | "right">("right");

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <Tabs
          variant="flat"
          ariaLabel="Drawer side"
          value={side}
          onValueChange={(next) => setSide(next as "left" | "right")}
          items={[
            { value: "left", label: "Left", content: <span /> },
            { value: "right", label: "Right", content: <span /> },
          ]}
        />
      )}
    >
      <div className="flex min-h-[24rem] w-full items-center justify-center p-8">
        <AppDrawer
          side={side}
          trigger={<Button>Open settings</Button>}
          title="Workspace settings"
          description="Manage the details shared across your team."
        >
          {({ close }) => (
            <div className="flex h-full flex-col">
              <nav className="space-y-1" aria-label="Workspace settings">
                {items.map(({ icon: Icon, label, detail }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-[var(--surface-muted)]"><Icon className="size-4" /></span>
                    <span><strong className="block text-sm">{label}</strong><span className="text-xs text-[var(--text-secondary)]">{detail}</span></span>
                  </button>
                ))}
              </nav>
              <Button className="mt-auto w-full" variant="bordered" onClick={close}>Done</Button>
            </div>
          )}
        </AppDrawer>
      </div>
    </PreviewCanvas>
  );
}
