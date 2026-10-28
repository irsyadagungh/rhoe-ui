export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.16,
    standard: 0.24,
    considered: 0.48,
    reveal: 0.6,
    expand: 0.72,
    lineReveal: 0.86,
  },
  ease: {
    enter: [0.16, 1, 0.3, 1],
    standard: [0.22, 1, 0.36, 1],
  },
  spring: {
    snappy: { type: "spring", visualDuration: 0.26, bounce: 0.12 },
    smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
    morph: { type: "spring", visualDuration: 0.42, bounce: 0.16 },
  },
  stagger: { item: 0.035, character: 0.025, word: 0.075, line: 0.08 },
  blur: { subtle: 2 },
} as const;
