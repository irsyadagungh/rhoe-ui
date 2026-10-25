"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

type SpanProps = Omit<HTMLMotionProps<"span">, "children">;

export interface RollingNumberProps extends SpanProps {
  value: number;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
}

type RollingPart =
  | { key: string; digit: number }
  | { key: string; text: string };

const rollingDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function getRollingParts(
  value: number,
  locale?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): RollingPart[] {
  const parts = new Intl.NumberFormat(locale, {
    ...format,
    numberingSystem: "latn",
  }).formatToParts(value);
  let integerPlace = parts.reduce(
    (count, part) => count + (part.type === "integer" ? part.value.length : 0),
    0,
  );
  let fractionPlace = 0;

  return parts.flatMap((part, index): RollingPart[] => {
    if (part.type === "integer") {
      return Array.from(part.value).map((character) => ({
        key: `integer-${--integerPlace}`,
        digit: Number(character),
      }));
    }

    if (part.type === "fraction") {
      return Array.from(part.value).map((character) => ({
        key: `fraction-${fractionPlace++}`,
        digit: Number(character),
      }));
    }

    return [
      {
        key: part.type === "group" ? `group-${integerPlace}` : `${part.type}-${index}`,
        text: part.value,
      },
    ];
  });
}

function RollingGlyph({
  position,
  digit,
}: {
  position: MotionValue<number>;
  digit: number;
}) {
  const offset = useTransform(
    position,
    (current) => ((((digit - current) % 10) + 15) % 10) - 5,
  );
  const transform = useTransform(offset, (current) => `translateY(${current}em)`);
  const opacity = useTransform(offset, (current) =>
    Math.max(0, 1 - Math.abs(current)),
  );
  const visibility = useTransform(offset, (current) =>
    Math.abs(current) >= 1 ? "hidden" : "visible",
  );
  const filter = useTransform(offset, (current) => {
    const distance = Math.abs(current);
    if (distance < 0.02 || distance >= 1) return "blur(0px)";
    return `blur(${(distance * motionTokens.blur.subtle).toFixed(2)}px)`;
  });

  return (
    <motion.span
      className="absolute inset-x-0 top-[var(--digit-feather)] bottom-[var(--digit-feather)] text-center will-change-[transform,opacity,filter]"
      style={{ transform, opacity, visibility, filter }}
    >
      {digit}
    </motion.span>
  );
}

function RollingColumn({
  digit,
  direction,
  reduceMotion,
}: {
  digit: number;
  direction: number;
  reduceMotion: boolean;
}) {
  const position = useMotionValue(digit);
  const wheel = useRef({ digit, target: digit });

  useEffect(() => {
    const state = wheel.current;
    if (state.digit === digit) return;

    const distance =
      direction < 0
        ? -((state.digit - digit + 10) % 10)
        : (digit - state.digit + 10) % 10;

    state.target += distance;
    state.digit = digit;

    if (reduceMotion) {
      position.jump(state.target);
      return;
    }

    const steps = Math.abs(distance);
    const controls = animate(position, state.target, {
      ...motionTokens.spring.smooth,
      visualDuration:
        motionTokens.duration.standard +
        Math.max(0, steps - 1) * motionTokens.stagger.word,
    });

    return () => controls.stop();
  }, [digit, direction, position, reduceMotion]);

  return (
    <span className="relative inline-block my-[calc(var(--digit-feather)*-1)] overflow-hidden py-[var(--digit-feather)] [--digit-feather:0.16em] [mask-image:linear-gradient(to_bottom,transparent,#000_calc(var(--digit-feather)*1.5),#000_calc(100%-var(--digit-feather)*1.5),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_calc(var(--digit-feather)*1.5),#000_calc(100%-var(--digit-feather)*1.5),transparent)]">
      <span className="invisible">0</span>
      {rollingDigits.map((item) => (
        <RollingGlyph key={item} position={position} digit={item} />
      ))}
    </span>
  );
}

export function RollingNumber({
  value,
  locale = "en-US",
  format,
  className,
  ...props
}: RollingNumberProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [change, setChange] = useState({ value, direction: 1 });
  if (change.value !== value) {
    setChange({
      value,
      direction: Math.abs(value) >= Math.abs(change.value) ? 1 : -1,
    });
  }
  const direction = change.direction;
  const parts = useMemo(
    () => getRollingParts(value, locale, format),
    [format, locale, value],
  );
  const formatted = parts
    .map((part) => ("digit" in part ? part.digit : part.text))
    .join("");

  return (
    <motion.span
      {...props}
      className={["inline-flex tabular-nums", className].filter(Boolean).join(" ")}
      aria-live="polite"
    >
      <span className="absolute size-px overflow-hidden [clip:rect(0,0,0,0)] [clip-path:inset(50%)] whitespace-nowrap">{formatted}</span>
      <span className="inline-flex items-center whitespace-nowrap select-none" aria-hidden="true">
        {parts.map((part) =>
          "digit" in part ? (
            <RollingColumn
              key={part.key}
              digit={part.digit}
              direction={direction}
              reduceMotion={reduceMotion}
            />
          ) : (
            <span key={part.key} className="inline-block whitespace-pre">
              {part.text}
            </span>
          ),
        )}
      </span>
    </motion.span>
  );
}
