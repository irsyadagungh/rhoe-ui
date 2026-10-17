"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

type SpanProps = Omit<HTMLMotionProps<"span">, "children">;

export interface ScrambleTextProps extends SpanProps {
  value: string;
  characters?: string;
  duration?: number;
  once?: boolean;
}

const defaultCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const scrambleFrameInterval = 1000 / 24;

export function ScrambleText({
  value,
  characters = defaultCharacters,
  duration = motionTokens.duration.lineReveal * 1000,
  once = true,
  className,
  ...props
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once, amount: 0.6 });
  const reduceMotion = useReducedMotion() ?? false;
  const [display, setDisplay] = useState(value);
  const [resolvedCharacters, setResolvedCharacters] = useState(0);
  const source = Array.from(value);
  const displayCharacters = Array.from(display);
  const animateCharacters = visible && !reduceMotion && characters.length > 0;
  let resolvedIndex = 0;

  useEffect(() => {
    if (!visible || reduceMotion || characters.length === 0) return;

    let frame = 0;
    const startedAt = performance.now();
    const total = Math.max(1, duration);
    const source = Array.from(value);
    const characterSet = Array.from(characters);
    const resolvableCount = source.filter((character) => !/\s/.test(character)).length;
    let nextUpdateAt = startedAt;

    const render = (progress: number) => {
      const resolvedCount = Math.floor(progress * resolvableCount);
      let resolved = 0;

      return source
        .map((character) => {
          if (/\s/.test(character)) return character;
          if (resolved++ < resolvedCount) return character;
          return characterSet[Math.floor(Math.random() * characterSet.length)];
        })
        .join("");
    };

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / total, 1);
      const resolvedCount = Math.floor(progress * resolvableCount);

      if (now >= nextUpdateAt || progress === 1) {
        nextUpdateAt = now + scrambleFrameInterval;
        setResolvedCharacters(resolvedCount);
        setDisplay(render(progress));
      }

      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        setResolvedCharacters(resolvableCount);
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [characters, duration, reduceMotion, value, visible]);

  return (
    <motion.span {...props} ref={ref} className={className} aria-label={value}>
      <span className="inline-flex whitespace-pre" aria-hidden="true">
        {source.map((sourceCharacter, index) => {
          const whitespace = /\s/.test(sourceCharacter);
          const isResolved =
            !animateCharacters || whitespace || resolvedIndex++ < resolvedCharacters;
          const visualCharacter = isResolved
            ? sourceCharacter
            : (displayCharacters[index] ?? sourceCharacter);

          if (whitespace) {
            return (
              <span className="inline-block" key={`${index}-space`}>
                {sourceCharacter}
              </span>
            );
          }

          return (
            <motion.span
              className="inline-block will-change-[transform,opacity,filter]"
              key={`${index}-${isResolved ? sourceCharacter : "scramble"}`}
              initial={
                isResolved && animateCharacters
                  ? {
                      opacity: 0,
                      filter: `blur(${motionTokens.blur.subtle}px)`,
                      transform: "translateY(0.12em)",
                    }
                  : false
              }
              animate={{ opacity: 1, filter: "blur(0px)", transform: "translateY(0em)" }}
              transition={
                isResolved && animateCharacters
                  ? {
                      duration: motionTokens.duration.fast,
                      ease: motionTokens.ease.enter,
                    }
                  : { duration: 0 }
              }
            >
              {visualCharacter}
            </motion.span>
          );
        })}
      </span>
    </motion.span>
  );
}
