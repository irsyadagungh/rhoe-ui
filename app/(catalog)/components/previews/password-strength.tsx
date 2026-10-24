"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { PasswordStrength } from "@/registry/components/password-strength/password-strength";
import type { InputVariant } from "@/registry/components/input/input";
import styles from "../preview-styles/password-strength.module.css";
import { PreviewSizeTabs } from "./size-tabs";

export function PasswordStrengthExample({ variant }: { variant: InputVariant }) {
  const [password, setPassword] = useState("");

  return (
    <PreviewSizeTabs>
      {(size) => <div className={styles.previewField}>
        <PasswordStrength
        label="Password"
        placeholder="Create a password"
        autoComplete="new-password"
        prefixIcon={<LockKeyhole />}
        variant={variant}
        size={size}
        value={password}
        onValueChange={setPassword}
        />
      </div>}
    </PreviewSizeTabs>
  );
}
