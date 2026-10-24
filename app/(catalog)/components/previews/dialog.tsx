"use client";

import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import { Dialog, type DialogActions, type DialogTone } from "@/registry/components/dialog/dialog";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

export function DialogSandbox() {
  const [tone, setTone] = useState<DialogTone>("neutral");
  const [actions, setActions] = useState<DialogActions>("confirm");
  const [mode, setMode] = useState<"trigger" | "programmatic">("trigger");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Dialog trigger mode"
            value={mode}
            onValueChange={(value) => setMode(value as "trigger" | "programmatic")}
            items={[
              { value: "trigger", label: "Trigger (Morph)", content: <span /> },
              { value: "programmatic", label: "Programmatic (State)", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Dialog tone"
            value={tone}
            onValueChange={(value) => setTone(value as DialogTone)}
            items={[
              { value: "neutral", label: "Neutral", content: <span /> },
              { value: "success", label: "Success", content: <span /> },
              { value: "warning", label: "Warning", content: <span /> },
              { value: "danger", label: "Danger", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Dialog actions"
            value={actions}
            onValueChange={(value) => setActions(value as DialogActions)}
            items={[
              { value: "confirm", label: "Close & continue", content: <span /> },
              { value: "close", label: "Close only", content: <span /> },
            ]}
          />
        </div>
      )}
    >
      <div className="grid min-h-56 place-items-center">
        {mode === "trigger" ? (
          <Dialog
            actions={actions}
            blocking={actions === "close"}
            tone={tone}
            title={actions === "close" ? "This action needs your attention" : "Publish these changes?"}
            description={actions === "close"
              ? "Review the information before you continue working."
              : "Your latest changes will become visible to everyone with access to this workspace."}
            continueLabel="Publish changes"
            trigger={<Button tone={tone === "neutral" ? "primary" : tone}>Open dialog</Button>}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button
              tone={tone === "neutral" ? "primary" : tone}
              onClick={() => setIsOpen(true)}
            >
              Open via state
            </Button>
            <Dialog
              open={isOpen}
              onOpenChange={setIsOpen}
              actions={actions}
              blocking={actions === "close"}
              tone={tone}
              title={actions === "close" ? "Action required" : "Publish changes?"}
              description="Opened programmatically via state without a wrapped trigger button."
              continueLabel="Confirm"
            />
          </div>
        )}
      </div>
    </PreviewCanvas>
  );
}
