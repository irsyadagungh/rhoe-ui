import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import { ThemeCustomizer } from "./theme-customizer";
import styles from "./theming.module.css";
import catalogStyles from "../../catalog.module.css";
import { docsPages, PageNavigation } from "../../page-navigation";

export const metadata: Metadata = createPageMetadata({
  title: "Tailwind CSS Component Theming",
  description: "Customize Rhoe UI with semantic Tailwind CSS tokens, light and dark color palettes, accessible states, and your existing shadcn theme.",
  path: "/docs/theming",
});

const palettes = {
  light: [
    ["Canvas", "#eef1ed"],
    ["Surface", "#fcfdfb"],
    ["Muted", "#e2e6e1"],
    ["Text", "#191b19"],
    ["Secondary", "#59605b"],
    ["Primary", "#252725"],
    ["Success surface", "#e7f6ec"],
    ["Success text", "#17653f"],
    ["Warning surface", "#fff3d6"],
    ["Warning text", "#6b4600"],
    ["Danger surface", "#fce8e6"],
    ["Danger text", "#8f1d14"],
    ["Border", "#d9ddd9"],
    ["Focus", "#3f6652"],
  ],
  dark: [
    ["Canvas", "#121412"],
    ["Surface", "#1a1d1a"],
    ["Muted", "#232623"],
    ["Text", "#f1f3f0"],
    ["Secondary", "#afb5b0"],
    ["Primary", "#ecefeb"],
    ["Success surface", "#173526"],
    ["Success text", "#8ee0ae"],
    ["Warning surface", "#3b2b12"],
    ["Warning text", "#f2c66f"],
    ["Danger surface", "#3d1d1c"],
    ["Danger text", "#ffaaa5"],
    ["Border", "#373b37"],
    ["Focus", "#93b7a2"],
  ],
} as const;

const variables = [
  ["--canvas", "Page background"],
  ["--surface", "Primary content surface"],
  ["--surface-muted", "Subtle controls and secondary regions"],
  ["--text", "Primary text and high-emphasis icons"],
  ["--text-secondary", "Supporting text"],
  ["--border", "Dividers and control outlines"],
  ["--primary", "Primary actions"],
  ["--primary-hover", "Primary action hover"],
  ["--primary-foreground", "Content placed on primary"],
  ["--success", "Success actions and strong status indicators"],
  ["--success-foreground", "Content placed on success"],
  ["--success-surface", "Subtle success status background"],
  ["--success-surface-foreground", "Content placed on a subtle success surface"],
  ["--warning", "Warning actions and strong status indicators"],
  ["--warning-foreground", "Content placed on warning"],
  ["--warning-surface", "Subtle warning status background"],
  ["--warning-surface-foreground", "Content placed on a subtle warning surface"],
  ["--danger", "Danger actions and error indicators"],
  ["--danger-foreground", "Content placed on danger"],
  ["--danger-surface", "Subtle danger status background"],
  ["--danger-surface-foreground", "Content placed on a subtle danger surface"],
  ["--focus", "Keyboard focus ring"],
] as const;

const explicitTheme = `<html data-theme="dark">
  ...
</html>`;

const tailwindMapping = `@import "tailwindcss";
@import "@/components/rhoe/foundation.css";
@import "@/components/rhoe/theme-tailwind.css";

/* Keep your existing Tailwind or shadcn theme tokens here. */
:root {
  --status-success: oklch(0.62 0.16 150);
  --status-success-foreground: oklch(0.2 0.05 150);
  --status-success-surface: oklch(0.94 0.05 150);
  --status-success-surface-foreground: oklch(0.32 0.09 150);
  --status-warning: oklch(0.72 0.15 80);
  --status-warning-foreground: oklch(0.24 0.05 80);
  --status-warning-surface: oklch(0.95 0.06 80);
  --status-warning-surface-foreground: oklch(0.38 0.1 80);
  --status-danger: oklch(0.58 0.2 25);
  --status-danger-foreground: oklch(0.98 0.01 25);
  --status-danger-surface: oklch(0.94 0.05 25);
  --status-danger-surface-foreground: oklch(0.42 0.14 25);
}`;

export default function ThemingPage() {
  return (
    <>
      <header className={catalogStyles.hero} id="overview">
        <h1>Theming</h1>
        <p className={catalogStyles.lede}>
          Rhoe UI uses neutral semantic tokens with a restrained green undertone in
          the canvas. Components consume roles such as primary and surface, so a
          theme can change without editing component styles.
        </p>
      </header>

      <section className={catalogStyles.section} aria-labelledby="color-palette">
        <h2 id="color-palette">Color palette</h2>
        <p className={catalogStyles.sectionIntro}>
          Light and dark modes preserve the same hierarchy. Primary actions remain
          neutral instead of inheriting the canvas tint.
        </p>
        <div className={styles.paletteColumns}>
          {Object.entries(palettes).map(([mode, colors]) => (
            <div className={styles.paletteGroup} key={mode}>
              <h3>{mode === "light" ? "Light mode" : "Dark mode"}</h3>
              <ul className={styles.swatchList}>
                {colors.map(([name, value]) => (
                  <li key={name}>
                    <span className={styles.swatch} style={{ backgroundColor: value }} />
                    <span>{name}</span>
                    <code>{value}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={catalogStyles.section} aria-labelledby="color-variables">
        <h2 id="color-variables">Color variables</h2>
        <p className={catalogStyles.sectionIntro}>
          Use semantic variables in components. Avoid referencing palette hex values
          directly outside the theme definition.
        </p>
        <div className={catalogStyles.tableWrap}>
          <table className={catalogStyles.table}>
            <thead><tr><th>Variable</th><th>Role</th></tr></thead>
            <tbody>
              {variables.map(([variable, role]) => (
                <tr key={variable}><td>{variable}</td><td>{role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={catalogStyles.note}>
          Status components use the surface and surface-foreground pairs by
          default. Borders belong only to an explicit bordered variant and should
          derive their color from the matching status foreground.
        </p>
      </section>

      <section className={catalogStyles.section} aria-labelledby="tailwind-mapping">
        <h2 id="tailwind-mapping">Tailwind and shadcn mapping</h2>
        <p className={catalogStyles.sectionIntro}>
          Import the adapter after Foundation to preserve your existing background,
          card, foreground, primary, destructive, border, and ring tokens. The
          status tokens in the example map success, warning, and danger to your
          own palette; Foundation provides a safe fallback until you add them. The
          adapter changes color roles only: component radius, spacing, and motion
          remain the same.
        </p>
        <CodeBlock code={tailwindMapping} language="css" />
      </section>

      <section className={catalogStyles.section} aria-labelledby="theme-mode">
        <h2 id="theme-mode">Theme mode</h2>
        <p className={catalogStyles.sectionIntro}>
          The default follows the operating system. Add a data-theme attribute to
          the html element when the user chooses an explicit mode.
        </p>
        <CodeBlock code={explicitTheme} language="html" />
      </section>

      <section className={catalogStyles.section} aria-labelledby="custom-theme">
        <h2 id="custom-theme">Custom theme</h2>
        <p className={catalogStyles.sectionIntro}>
          Adjust the semantic roles, inspect them on a real surface, then copy the
          generated override into your global stylesheet.
        </p>
        <ThemeCustomizer />
      </section>

      <PageNavigation items={docsPages} currentHref="/docs/theming" />
    </>
  );
}
