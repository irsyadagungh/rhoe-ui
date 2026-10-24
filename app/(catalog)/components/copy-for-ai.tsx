"use client";

import { Download } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import styles from "../catalog.module.css";

export function MarkdownDownload({ markdown, filename }: { markdown: string; filename: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.aiNoteActions}>
      <Button variant="bordered" size="small" icon={<Download aria-hidden="true" />} onClick={download}>
        Download .md
      </Button>
    </div>
  );
}
