"use client";

import { useState } from "react";
import { CurrencyInput } from "@/registry/components/currency-input/currency-input";
import type { InputVariant } from "@/registry/components/input/input";
import styles from "../preview-styles/currency-input.module.css";
import { PreviewSizeTabs } from "./size-tabs";

export function CurrencyInputExample({ variant }: { variant: InputVariant }) {
  const [amount, setAmount] = useState<number | null>(20000);
  const [currency, setCurrency] = useState("IDR");

  return (
    <PreviewSizeTabs>
      {(size) => <div className={styles.previewField}>
        <CurrencyInput
        label="Amount"
        variant={variant}
        size={size}
        locale="id-ID"
        limit={1_000_000_000_000}
        currency={currency}
        value={amount}
        onCurrencyChange={setCurrency}
        onValueChange={setAmount}
        />
      </div>}
    </PreviewSizeTabs>
  );
}
