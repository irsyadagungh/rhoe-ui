"use client";

import { useState } from "react";
import { Check, Menu, Upload, X } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import {
  IconMorph,
  iconMorphPresets,
} from "@/registry/components/icon-morph/icon-morph";
import styles from "../preview-styles/icon-morph.module.css";

export function IconMorphExample({ fallback = false }: { fallback?: boolean }) {
  const [active, setActive] = useState(false);

  return (
    <div className={styles.example}>
      <button
        className={styles.iconButton}
        type="button"
        aria-label={active ? "Show menu" : "Close menu"}
        aria-pressed={active}
        onClick={() => setActive((value) => !value)}
      >
        <IconMorph
          state={active}
          from={fallback ? <Upload /> : <Menu />}
          to={fallback ? <Check /> : <X />}
          paths={fallback ? undefined : iconMorphPresets.menuClose}
          size={22}
        />
      </button>
      <Button variant="bordered" size="small" onClick={() => setActive((value) => !value)}>
        Toggle state
      </Button>
    </div>
  );
}
