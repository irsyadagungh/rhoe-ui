import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import styles from "../../catalog.module.css";
import { docsPages, PageNavigation } from "../../page-navigation";

export const metadata: Metadata = createPageMetadata({
  title: "React Animation and Motion System",
  description: "Use Rhoe UI motion tokens, spring animations, easing curves, staggered reveals, morphing transitions, and reduced-motion support.",
  path: "/docs/motion",
});

const cssTokens = [
  ["--duration-fast", "160ms", "Hover, focus, color, and compact state feedback"],
  ["--duration-standard", "280ms", "Larger CSS transitions and spatial state changes"],
  ["--ease-standard", "cubic-bezier(0.22, 1, 0.36, 1)", "A quick response with a soft finish"],
] as const;

const durationTokens = [
  ["instant", "0.12s", "Immediate feedback and reduced transitions"],
  ["fast", "0.16s", "Opacity, icons, and small state changes"],
  ["standard", "0.24s", "Common interface transitions"],
  ["considered", "0.48s", "Content entering with more visual distance"],
  ["reveal", "0.60s", "Text and content reveals"],
  ["lineReveal", "0.86s", "Longer line-based text reveals"],
] as const;

const springTokens = [
  ["snappy", "0.26s / 0.12", "Switches, checks, and direct control feedback"],
  ["smooth", "0.40s / 0", "Position, size, and layout movement"],
  ["morph", "0.42s / 0.16", "A trigger changing into another surface"],
] as const;

const cssExample = `className="
  transition-[background-color,border-color,color]
  duration-[var(--duration-fast)]
  ease-[var(--ease-standard)]
  motion-reduce:duration-[0.01ms]
"`;

const motionExample = `import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/components/rhoe/lib/motion-tokens";

export function ExpandingSurface({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ width: open ? 360 : 120 }}
      transition={
        reduceMotion ? { duration: 0 } : motionTokens.spring.morph
      }
    />
  );
}`;

const customizeExample = `/* globals.css */
:root {
  --duration-fast: 140ms;
  --duration-standard: 260ms;
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
}`;

function TokenTable({
  headings,
  rows,
}: {
  headings: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MotionPage() {
  return (
    <>
      <header className={styles.hero} id="overview">
        <p className={styles.eyebrow}>Docs / Motion</p>
        <h1>Motion</h1>
        <p className={styles.lede}>
          Rhoe UI uses shared motion values so components respond with the same
          rhythm. CSS variables handle simple transitions, while Motion React
          tokens handle springs, morphing, layout movement, and staged reveals.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="css-tokens">
        <h2 id="css-tokens">CSS and Tailwind</h2>
        <p className={styles.sectionIntro}>
          Foundation exposes CSS variables for transitions that do not need JavaScript.
          Tailwind consumes the same variables through arbitrary-value utilities, so
          no additional Tailwind motion configuration is required.
        </p>
        <TokenTable headings={["Token", "Default", "Use"]} rows={cssTokens} />
        <h3 className={styles.subheading}>Tailwind example</h3>
        <CodeBlock code={cssExample} language="tsx" />
      </section>

      <section className={styles.section} aria-labelledby="motion-react">
        <h2 id="motion-react">Motion React</h2>
        <p className={styles.sectionIntro}>
          Components that animate dimensions or position import the shared TypeScript
          config. This keeps interruptible springs and content reveals consistent.
        </p>
        <h3 className={styles.subheading}>Durations</h3>
        <TokenTable headings={["Token", "Default", "Use"]} rows={durationTokens} />
        <h3 className={styles.subheading}>Springs</h3>
        <TokenTable headings={["Token", "Visual duration / bounce", "Use"]} rows={springTokens} />
        <p className={styles.note}>
          The config also provides enter and standard easing curves, stagger values
          for items, characters, words, and lines, plus a subtle 2px transition blur.
        </p>
        <h3 className={styles.subheading}>Motion example</h3>
        <CodeBlock code={motionExample} language="tsx" />
      </section>

      <section className={styles.section} aria-labelledby="choosing-motion">
        <h2 id="choosing-motion">Choosing motion</h2>
        <ul className={styles.bulletList}>
          <li>Use CSS tokens for hover, focus, opacity, color, and simple transforms.</li>
          <li>Use <code>snappy</code> for direct feedback such as switches and checks.</li>
          <li>Use <code>smooth</code> for continuous position, size, and layout movement.</li>
          <li>Use <code>morph</code> when a trigger becomes a panel, input, or dialog.</li>
          <li>Animate transform and opacity when layout measurement is unnecessary.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="reduced-motion">
        <h2 id="reduced-motion">Reduced motion</h2>
        <p className={styles.sectionIntro}>
          Every animated component should respect the operating system preference.
          Use Tailwind&apos;s <code>motion-reduce</code> variant for CSS and
          <code>useReducedMotion</code> for Motion React. Preserve the final state and
          remove spatial travel rather than removing the interface response.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="customization">
        <h2 id="customization">Customization</h2>
        <p className={styles.sectionIntro}>
          Override CSS durations globally when the product needs a different pace.
          Edit <code>motion-tokens.ts</code> when changing springs or reveal timing.
          Theme colors can change independently without altering motion behavior.
        </p>
        <CodeBlock code={customizeExample} language="css" />
      </section>

      <PageNavigation items={docsPages} currentHref="/docs/motion" />
    </>
  );
}
