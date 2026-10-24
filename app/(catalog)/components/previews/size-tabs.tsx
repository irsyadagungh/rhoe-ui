"use client";

import type { ReactNode } from "react";
import { Tabs } from "@/registry/components/tabs/tabs";
import type { ButtonSize } from "@/registry/components/button/button";
import styles from "../preview-styles/size-tabs.module.css";

const sizes: Array<{ value: ButtonSize; label: string }> = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function PreviewSizeTabs({ children }: { children: (size: ButtonSize) => ReactNode }) {
  return (
    <Tabs
      className={styles.root}
      variant="flat"
      ariaLabel="Preview size"
      listClassName={styles.list}
      panelClassName={styles.panel}
      items={sizes.map((size) => ({
        ...size,
        content: children(size.value),
      }))}
    />
  );
}
