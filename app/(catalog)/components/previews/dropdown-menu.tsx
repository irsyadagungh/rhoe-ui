"use client";

import { useState } from "react";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, type DropdownMenuTriggerContent, type DropdownMenuVariant } from "@/registry/components/dropdown-menu/dropdown-menu";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";
import styles from "../preview-styles/dropdown-menu.module.css";

export function DropdownMenuExample({ triggerContent = "icon", variant = "filled" }: { triggerContent?: DropdownMenuTriggerContent; variant?: DropdownMenuVariant }) {
  return <DropdownMenu label="Actions" ariaLabel="Open actions" icon={<Ellipsis />} triggerContent={triggerContent} variant={variant} align="center" items={[
    { value: "view", label: "View", icon: <Eye /> },
    { value: "edit", label: "Edit", icon: <Pencil /> },
    { value: "delete", label: "Delete", icon: <Trash2 />, danger: true },
  ]} />;
}

export function DropdownMenuSandbox() {
  const [triggerContent, setTriggerContent] = useState<DropdownMenuTriggerContent>("icon");
  const [variant, setVariant] = useState<DropdownMenuVariant>("filled");

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={
        <div className="flex w-full flex-wrap items-start gap-x-5">
          <Tabs
            className={styles.controls}
            variant="flat"
            ariaLabel="Trigger content"
            value={triggerContent}
            onValueChange={(value) => setTriggerContent(value as DropdownMenuTriggerContent)}
            items={[
              { value: "icon", label: "Icon", content: <span /> },
              { value: "icon-text", label: "Icon & text", content: <span /> },
              { value: "text", label: "Text", content: <span /> },
            ]}
          />
          <Tabs
            className={styles.controls}
            variant="flat"
            ariaLabel="Surface variant"
            value={variant}
            onValueChange={(value) => setVariant(value as DropdownMenuVariant)}
            items={[
              { value: "filled", label: "Filled", content: <span /> },
              { value: "bordered", label: "Bordered", content: <span /> },
            ]}
          />
        </div>
      }
    >
      <DropdownMenuExample triggerContent={triggerContent} variant={variant} />
    </PreviewCanvas>
  );
}
