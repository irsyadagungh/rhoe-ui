"use client";

import { useEffect, useRef, useState } from "react";
import {
  TextReveal,
  type TextRevealProps,
} from "@/registry/components/text-reveal/text-reveal";
import { MorphingText } from "@/registry/components/morphing-text/morphing-text";
import { ScrambleText } from "@/registry/components/scramble-text/scramble-text";
import { RollingNumber } from "@/registry/components/rolling-number/rolling-number";
import { Button } from "@/registry/components/button/button";
import { Minus, Plus } from "lucide-react";
import { PreviewCanvas } from "../preview-canvas";
import styles from "../preview-styles/text-animation.module.css";

type Example = "reveal" | "morph" | "scramble" | "number";
const morphingTextStates = [
  "Save",
  "Saving",
  "Saved",
] as const;

export function TextAnimationExample({
  type,
  revealBy = "word",
}: {
  type: Example;
  revealBy?: NonNullable<TextRevealProps["by"]>;
}) {
  const [morphSource, setMorphSource] = useState(
    morphingTextStates.join(", "),
  );
  const [morphIndex, setMorphIndex] = useState(0);
  const [scrambleKey, setScrambleKey] = useState(0);
  const [number, setNumber] = useState(100);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const morphItems = morphSource
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
    },
    [],
  );

  if (type === "reveal") {
    const value = "Motion should make change easier to understand.";
    const lines =
      revealBy === "line"
        ? ["Motion should make", "change easier", "to understand."]
        : undefined;

    return (
      <p
        className={[
          styles.reveal,
          revealBy === "line" ? styles.revealByLine : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <TextReveal key={revealBy} by={revealBy} lines={lines}>
          {value}
        </TextReveal>
      </p>
    );
  }

  if (type === "morph") {
    const animateStates = () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      setMorphIndex(0);
      timers.current = morphItems.slice(1).map((_, index) =>
        setTimeout(() => setMorphIndex(index + 1), (index + 1) * 850),
      );
    };

    const updateSource = (value: string) => {
      const itemCount = value.split(",").filter((item) => item.trim()).length;
      setMorphSource(value);
      setMorphIndex((index) => Math.min(index, Math.max(0, itemCount - 1)));
    };

    const resetStates = () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current = [];
      setMorphSource(morphingTextStates.join(", "));
      setMorphIndex(0);
    };

    return (
      <PreviewCanvas
        toolbar={
          <div className={styles.morphEditor} aria-label="Morphing text states">
            <label className={styles.morphArrayField}>
              <span className={styles.srOnly}>
                Text states separated by commas
              </span>
              <span aria-hidden="true">[</span>
              <input
                value={morphSource}
                spellCheck={false}
                onChange={(event) => updateSource(event.target.value)}
              />
              <span aria-hidden="true">]</span>
            </label>
          </div>
        }
        onReplay={resetStates}
      >
        <div className={styles.morphSandbox}>
          <p className={styles.morphHint}>
            Edit the words in the toolbar and separate each state with commas to try it.
          </p>
          <div className={styles.morphPreview}>
            <MorphingText value={morphItems[morphIndex] ?? ""} />
          </div>
          <Button
            variant="bordered"
            size="small"
            disabled={morphItems.length < 2}
            onClick={animateStates}
          >
            Animate
          </Button>
        </div>
      </PreviewCanvas>
    );
  }

  if (type === "scramble") {
    return (
      <div className={styles.stack}>
        <ScrambleText
          key={scrambleKey}
          className={styles.scramble}
          value="DEPLOYMENT READY"
        />
        <Button variant="bordered" size="small" onClick={() => setScrambleKey((key) => key + 1)}>
          Replay
        </Button>
      </div>
    );
  }

  const changeNumber = (delta: number) => {
    setNumber((current) => current + delta);
  };

  return (
    <div className={styles.numberRow}>
      <Button
        className={styles.numberControlButton}
        variant="bordered"
        size="small"
        aria-label="Decrease by 5"
        title="Decrease by 5"
        onClick={() => changeNumber(-5)}
      >
        <Minus size={16} aria-hidden="true" />
      </Button>
      <RollingNumber className={styles.number} value={number} />
      <Button
        className={styles.numberControlButton}
        variant="bordered"
        size="small"
        aria-label="Increase by 5"
        title="Increase by 5"
        onClick={() => changeNumber(5)}
      >
        <Plus size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
