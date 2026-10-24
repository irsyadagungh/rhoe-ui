"use client";

import { AlignLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import { Textarea, type TextareaVariant } from "@/registry/components/textarea/textarea";
import styles from "../preview-styles/textarea.module.css";

type HeightMode = "manual" | "auto";

export function TextareaSandbox({ variant }: { variant: TextareaVariant }) {
  const [heightMode, setHeightMode] = useState<HeightMode>("manual");
  const [value, setValue] = useState("Share enough detail for your teammates to understand the next step.");

  return (
    <div className={styles.previewStack}>
          <div className={styles.previewField}>
            <Textarea
              label="Project brief"
              hint="Give collaborators the context they need."
              placeholder="Describe the project"
              prefixIcon={<AlignLeft />}
              variant={variant}
              value={value}
              maxLength={280}
              autoResize={heightMode === "auto"}
              onValueChange={setValue}
            />
          </div>
          <div className={styles.previewControls}>
            <span>Automatic height</span>
            <Button
              variant="bordered"
              tone="secondary"
              size="small"
              aria-pressed={heightMode === "auto"}
              onClick={() => setHeightMode((mode) => mode === "auto" ? "manual" : "auto")}
            >
              {heightMode === "auto" ? "On" : "Off"}
            </Button>
          </div>
    </div>
  );
}
