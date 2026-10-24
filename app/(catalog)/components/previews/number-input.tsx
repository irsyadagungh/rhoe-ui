"use client";

import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import { NumberInput } from "@/registry/components/number-input/number-input";
import type { InputVariant } from "@/registry/components/input/input";
import styles from "../preview-styles/number-input.module.css";
import { PreviewSizeTabs } from "./size-tabs";

export function NumberInputExample({ variant }: { variant: InputVariant }) {
  const [value, setValue] = useState(25);
  const [hoverable, setHoverable] = useState(false);

  return (
    <PreviewSizeTabs>
      {(size) => <div className={styles.previewField}>
        <NumberInput
        label="Quantity"
        hint="Use the controls or the Up and Down arrow keys."
        variant={variant}
        value={value}
        min={20}
        max={100}
        step={5}
        hoverable={hoverable}
        size={size}
        onValueChange={setValue}
        />
        <div className={styles.previewControls}>
        <span>Hoverable controls</span>
        <Button
          variant="bordered"
          tone="secondary"
          size="small"
          aria-pressed={hoverable}
          onClick={() => setHoverable((current) => !current)}
        >
          {hoverable ? "On" : "Off"}
        </Button>
        </div>
      </div>}
    </PreviewSizeTabs>
  );
}
