"use client";

import { useState } from "react";
import { Check, LoaderCircle, Upload } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/registry/components/button/button";
import styles from "../preview-styles/button.module.css";
import { PreviewSizeTabs } from "./size-tabs";

const tones = ["primary", "secondary", "success", "warning", "danger"] as const;

export function ButtonExample({ variant }: { variant: ButtonVariant | "action" }) {
  const [state, setState] = useState(0);

  return (
    <PreviewSizeTabs>
      {(size) => variant === "action" ? (
        <div className={styles.previewGroup}>
        <Button
          label={["Publish", "Publishing", "Published"]}
          icon={[<Upload key="upload" />, <LoaderCircle key="loading" />, <Check key="check" />]}
          tone={["primary", "warning", "success"]}
          loading={[false, true, false]}
          state={state}
          size={size}
          onClick={() => setState((value) => (value + 1) % 3)}
        />
        <Button
          label={["Save", "Saving", "Saved"]}
          state={state}
          variant="bordered"
          size={size}
          onClick={() => setState((value) => (value + 1) % 3)}
        />
        </div>
      ) : <ButtonShowcase size={size} variant={variant} />}
    </PreviewSizeTabs>
  );
}

function ButtonShowcase({ size, variant }: { size: ButtonSize; variant: ButtonVariant }) {
  return (
    <div className={styles.previewGrid}>
      {tones.map((tone) => (
        <div className={styles.previewGroup} key={tone}>
          <Button size={size} variant={variant} tone={tone}>{tone}</Button>
          <Button size={size} variant={variant} tone={tone} icon={<Upload />}>Upload</Button>
          <Button size={size} variant={variant} tone={tone} icon={<Upload />} aria-label={`Upload ${tone}`} />
        </div>
      ))}
    </div>
  );
}
