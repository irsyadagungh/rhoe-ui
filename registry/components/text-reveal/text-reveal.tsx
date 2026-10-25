"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

type SpanProps = Omit<HTMLMotionProps<"span">, "children">;

export interface TextRevealProps extends SpanProps {
  children: string;
  by?: "word" | "character" | "line";
  lines?: string[];
  once?: boolean;
  blur?: boolean;
}

interface RevealPart {
  value: string;
  animated: boolean;
  line: boolean;
  staggerIndex: number;
}

function splitRevealText(
  value: string,
  by: TextRevealProps["by"],
  lines?: string[],
): RevealPart[] {
  if (by === "line") {
    const explicitLines = lines?.length ? lines : value.split(/\r?\n/);

    return explicitLines.map((line, index) => ({
      value: line,
      animated: true,
      line: true,
      staggerIndex: index,
    }));
  }

  const parts = by === "character" ? Array.from(value) : value.split(/(\s+)/);
  let staggerIndex = 0;

  return parts.filter(Boolean).map((part) => {
    const animated = !/^\s+$/.test(part);
    const currentIndex = staggerIndex;
    if (animated) staggerIndex += 1;

    return {
      value: part,
      animated,
      line: false,
      staggerIndex: currentIndex,
    };
  });
}

export function TextReveal({
  children,
  by = "word",
  lines,
  once = true,
  blur = true,
  className,
  ...props
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once, amount: 0.45 });
  const reduceMotion = useReducedMotion() ?? false;
  const parts = splitRevealText(children, by, lines);
  const stagger = motionTokens.stagger[by];

  return (
    <motion.span
      {...props}
      ref={ref}
      className={["inline", className].filter(Boolean).join(" ")}
      aria-label={children}
    >
      <span className="whitespace-pre-wrap" aria-hidden="true">
        {parts.map((part, index) => {
          if (!part.animated) {
            return <span key={`${part.value}-${index}`}>{part.value}</span>;
          }

          return (
            <span
              key={`${part.value}-${index}`}
              className={part.line ? "block -mx-[0.12em] -mt-[0.06em] -mb-[0.18em] overflow-hidden px-[0.12em] pt-[0.06em] pb-[0.18em]" : "inline-block overflow-hidden align-bottom"}
            >
              <motion.span
                className={part.line ? "inline-block will-change-[transform,opacity]" : "inline-block will-change-[transform,opacity]"}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        filter: blur && !reduceMotion ? "blur(6px)" : "none",
                        transform: part.line
                          ? "translateY(112%)"
                          : "translateY(100%)",
                      }
                }
                animate={
                  visible
                    ? { opacity: 1, transform: "translateY(0%)", filter: blur && !reduceMotion ? "blur(0px)" : "none" }
                    : {
                        opacity: 0,
                        filter: blur && !reduceMotion ? "blur(6px)" : "none",
                        transform: reduceMotion
                          ? "none"
                          : part.line
                            ? "translateY(112%)"
                            : "translateY(100%)",
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: motionTokens.duration.fast }
                    : part.line
                      ? {
                          transform: {
                            duration: motionTokens.duration.lineReveal,
                            ease: motionTokens.ease.enter,
                            delay: part.staggerIndex * stagger,
                          },
                          filter: {
                            duration: motionTokens.duration.lineReveal,
                            ease: motionTokens.ease.enter,
                            delay: part.staggerIndex * stagger,
                          },
                          opacity: {
                            duration: motionTokens.duration.considered,
                            ease: motionTokens.ease.standard,
                            delay: part.staggerIndex * stagger,
                          },
                        }
                      : {
                          duration: motionTokens.duration.reveal,
                          ease: motionTokens.ease.enter,
                          delay: part.staggerIndex * stagger,
                        }
                }
              >
                {part.value || "\u00a0"}
              </motion.span>
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
