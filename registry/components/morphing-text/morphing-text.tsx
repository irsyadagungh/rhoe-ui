"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

type SpanProps = Omit<HTMLMotionProps<"span">, "children">;

export interface MorphingTextProps extends SpanProps {
  value: string;
}

interface TextDifference {
  prefix: string;
  previous: string;
  current: string;
  suffix: string;
}

function compareText(previous: string, current: string): TextDifference {
  const previousCharacters = Array.from(previous);
  const currentCharacters = Array.from(current);
  const sharedLength = Math.min(previousCharacters.length, currentCharacters.length);
  let prefixLength = 0;

  while (
    prefixLength < sharedLength &&
    previousCharacters[prefixLength] === currentCharacters[prefixLength]
  ) {
    prefixLength += 1;
  }

  let previousEnd = previousCharacters.length;
  let currentEnd = currentCharacters.length;

  while (
    previousEnd > prefixLength &&
    currentEnd > prefixLength &&
    previousCharacters[previousEnd - 1] === currentCharacters[currentEnd - 1]
  ) {
    previousEnd -= 1;
    currentEnd -= 1;
  }

  return {
    prefix: currentCharacters.slice(0, prefixLength).join(""),
    previous: previousCharacters.slice(prefixLength, previousEnd).join(""),
    current: currentCharacters.slice(prefixLength, currentEnd).join(""),
    suffix: currentCharacters.slice(currentEnd).join(""),
  };
}

export function MorphingText({
  value,
  className,
  style,
  ...props
}: MorphingTextProps) {
  const [change, setChange] = useState({ previous: value, current: value });
  const measureRef = useRef<HTMLSpanElement>(null);
  const firstMeasurement = useRef(true);
  const reduceMotion = useReducedMotion() ?? false;
  const width = useMotionValue(0);

  if (change.current !== value) {
    setChange({ previous: change.current, current: value });
  }

  const difference = compareText(change.previous, change.current);
  const changedText = difference.current;
  const hasChangedText = Boolean(difference.previous || changedText);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    let stopAnimation = () => {};

    const resize = () => {
      const nextWidth = measure.getBoundingClientRect().width;
      stopAnimation();

      if (firstMeasurement.current || reduceMotion) {
        firstMeasurement.current = false;
        width.jump(nextWidth);
        return;
      }

      const controls = animate(width, nextWidth, motionTokens.spring.smooth);
      stopAnimation = () => controls.stop();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(measure);
    return () => {
      stopAnimation();
      observer.disconnect();
    };
  }, [changedText, reduceMotion, width]);

  return (
    <motion.span
      {...props}
      className={["relative inline-block whitespace-nowrap", className].filter(Boolean).join(" ")}
      style={style}
      aria-live="polite"
    >
      <span className="absolute size-px overflow-hidden [clip:rect(0,0,0,0)] [clip-path:inset(50%)] whitespace-nowrap">{value}</span>
      <span className="inline-flex items-baseline whitespace-nowrap" aria-hidden="true">
        <span className="whitespace-pre">{difference.prefix}</span>
        <motion.span className="relative inline-grid min-w-0 overflow-hidden text-start" style={{ width }}>
          {hasChangedText ? (
            <motion.span
              key={change.current}
              className="absolute top-0 left-0 flex w-max flex-col [line-height:inherit] will-change-transform"
              initial={{
                transform: reduceMotion ? "translateY(-50%)" : "translateY(0%)",
              }}
              animate={{ transform: "translateY(-50%)" }}
              transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
            >
              <span className="block h-[1lh] whitespace-pre">
                {difference.previous || "\u00a0"}
              </span>
              <span className="block h-[1lh] whitespace-pre">{changedText || "\u00a0"}</span>
            </motion.span>
          ) : null}
          <span className="col-[1] row-[1] invisible inline-block justify-self-start whitespace-pre pointer-events-none">{changedText || "\u00a0"}</span>
          <span ref={measureRef} className="absolute invisible w-max whitespace-pre pointer-events-none">
            {changedText}
          </span>
        </motion.span>
        <span className="whitespace-pre">{difference.suffix}</span>
      </span>
    </motion.span>
  );
}
