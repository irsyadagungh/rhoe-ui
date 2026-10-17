"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface IconMorphPaths {
  from: string[];
  to: string[];
}

export interface IconMorphProps {
  state: boolean;
  from: ReactNode;
  to: ReactNode;
  paths?: IconMorphPaths;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

const pathCommands = (path: string) => path.match(/[a-z]/gi)?.join("") ?? "";
const pathValues = (path: string) =>
  path.match(/-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.length ?? 0;

function pathsCanMorph(paths?: IconMorphPaths) {
  if (!paths || paths.from.length === 0 || paths.from.length !== paths.to.length) {
    return false;
  }

  return paths.from.every(
    (path, index) =>
      pathCommands(path) === pathCommands(paths.to[index] ?? "") &&
      pathValues(path) === pathValues(paths.to[index] ?? ""),
  );
}

export const iconMorphPresets = {
  menuClose: {
    from: ["M4 7L20 7", "M4 12L20 12", "M4 17L20 17"],
    to: ["M6 6L18 18", "M12 12L12 12", "M18 6L6 18"],
  },
  plusCheck: {
    from: ["M12 5L12 19", "M5 12L19 12"],
    to: ["M5 13L10 18", "M10 18L19 7"],
  },
  playPause: {
    from: ["M7 5L12 8L12 16L7 19Z", "M12 8L19 12L12 16L12 8Z"],
    to: ["M7 5L11 5L11 19L7 19Z", "M14 5L18 5L18 19L14 19Z"],
  },
  chevron: {
    from: ["M6 9L12 15L18 9"],
    to: ["M9 6L15 12L9 18"],
  },
} satisfies Record<string, IconMorphPaths>;

export function IconMorph({
  state,
  from,
  to,
  paths,
  size = 24,
  strokeWidth = 1.75,
  className,
  style,
}: IconMorphProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const canMorph = pathsCanMorph(paths);
  const rootStyle = {
    ...style,
    "--icon-morph-size": `${size}px`,
  } as CSSProperties;

  if (canMorph && paths) {
    return (
      <motion.svg
        className={["relative inline-grid size-[var(--icon-morph-size)] shrink-0 place-items-center align-middle text-[inherit]", className].filter(Boolean).join(" ")}
        style={rootStyle}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {paths.from.map((path, index) => (
          <motion.path
            key={index}
            initial={false}
            animate={{ d: state ? paths.to[index] : path }}
            transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
          />
        ))}
      </motion.svg>
    );
  }

  const hidden = {
    opacity: 0,
    scale: reduceMotion ? 1 : 0.62,
  };
  const visible = { opacity: 1, scale: 1 };
  const transition = reduceMotion
    ? { duration: 0 }
    : {
        scale: motionTokens.spring.smooth,
        opacity: {
          duration: motionTokens.duration.fast,
          ease: motionTokens.ease.standard,
        },
      };

  return (
    <span
      className={["relative inline-grid size-[var(--icon-morph-size)] shrink-0 place-items-center align-middle text-[inherit]", className].filter(Boolean).join(" ")}
      style={rootStyle}
      aria-hidden="true"
    >
      <motion.span
        className="absolute inset-0 grid origin-center place-items-center will-change-[transform,opacity] motion-reduce:will-change-auto [&>svg]:size-full"
        initial={false}
        animate={state ? hidden : visible}
        transition={transition}
      >
        {from}
      </motion.span>
      <motion.span
        className="absolute inset-0 grid origin-center place-items-center will-change-[transform,opacity] motion-reduce:will-change-auto [&>svg]:size-full"
        initial={false}
        animate={state ? visible : hidden}
        transition={transition}
      >
        {to}
      </motion.span>
    </span>
  );
}
