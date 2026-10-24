"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import styles from "../catalog.module.css";

export function PreviewCanvas({
  children,
  identity = "preview",
  showReplay = true,
  toolbar,
  onReplay,
  expandable = false,
  expanded = false,
}: {
  children: ReactNode;
  identity?: string;
  showReplay?: boolean;
  toolbar?: ReactNode;
  onReplay?: () => void;
  expandable?: boolean;
  expanded?: boolean;
}) {
  const [replay, setReplay] = useState(0);

  const replayPreview = () => {
    onReplay?.();
    setReplay((value) => value + 1);
  };

  return (
    <div className={styles.previewSandbox}>
      {toolbar ? (
        <div className={styles.previewSandboxToolbar}>{toolbar}</div>
      ) : null}
      <div className={styles.previewCanvas} data-expandable={expandable || undefined} data-expanded={expanded || undefined}>
        {showReplay ? (
          <Button
            className={styles.previewReplay}
            variant="text"
            size="small"
            aria-label="Replay preview animation"
            title="Replay preview animation"
            onClick={replayPreview}
          >
            <RotateCcw size={15} aria-hidden="true" />
          </Button>
        ) : null}
        <div
          className={styles.previewStage}
          key={`${identity}-${replay}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
