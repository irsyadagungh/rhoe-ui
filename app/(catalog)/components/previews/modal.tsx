"use client";

import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import { Input } from "@/registry/components/input/input";
import { Modal } from "@/registry/components/modal/modal";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function ModalExample() {
  return (
    <Modal
      trigger={<Button>Invite member</Button>}
      title="Invite member"
      description="Send an invitation link to collaborate in this workspace."
      width={440}
    >
      {({ close }) => (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            defaultValue="ava@company.io"
          />
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button variant="text" tone="secondary" onClick={close} type="button">
              Cancel
            </Button>
            <Button type="submit">Send invitation</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function ModalSandbox() {
  const [mode, setMode] = useState<"trigger" | "programmatic" | "initial">("trigger");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex w-full flex-wrap items-start gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Modal opening mode"
            value={mode}
            onValueChange={(val) => setMode(val as "trigger" | "programmatic" | "initial")}
            items={[
              { value: "trigger", label: "Trigger (Morphing)", content: <span /> },
              { value: "programmatic", label: "Controlled (Center Spring)", content: <span /> },
              { value: "initial", label: "Initially open", content: <span /> },
            ]}
          />
        </div>
      )}
    >
      <div className="flex min-h-[320px] w-full items-center justify-center p-8">
        {mode === "trigger" ? (
          <Modal
            trigger={<Button>Invite member</Button>}
            title="Invite member"
            description="Send an invitation link to collaborate in this workspace."
            width={440}
          >
            {({ close }) => (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  close();
                }}
              >
                <Input
                  label="Email address"
                  type="email"
                  placeholder="colleague@company.com"
                  defaultValue="ava@company.io"
                />
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <Button variant="text" tone="secondary" onClick={close} type="button">
                    Cancel
                  </Button>
                  <Button type="submit">Send invitation</Button>
                </div>
              </form>
            )}
          </Modal>
        ) : mode === "initial" ? (
          <Modal key="initial" defaultOpen trigger={<Button>Open again</Button>} title="Welcome" width={440}>
            <p className="text-sm text-[var(--text-secondary)]">Your workspace is ready.</p>
          </Modal>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button onClick={() => setIsOpen(true)}>Open invite form</Button>
            <span className="text-xs text-[var(--text-secondary)]">
              State: {isOpen ? "Open" : "Closed"}
            </span>
            <Modal
              open={isOpen}
              onOpenChange={setIsOpen}
              title="Invite member"
              description="Opened programmatically via state without an inline trigger."
              width={440}
            >
              {({ close }) => (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    close();
                  }}
                >
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="colleague@company.com"
                    defaultValue="noah@company.io"
                  />
                  <div className="mt-6 flex items-center justify-end gap-2.5">
                    <Button variant="text" tone="secondary" onClick={close} type="button">
                      Cancel
                    </Button>
                    <Button type="submit">Send invitation</Button>
                  </div>
                </form>
              )}
            </Modal>
          </div>
        )}
      </div>
    </PreviewCanvas>
  );
}
