import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { ButtonLink } from "@/registry/components/button/button";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import catalogStyles from "../../catalog.module.css";
import { PackageManagerCommand } from "../../components/installation-command";
import { docsPages, PageNavigation } from "../../page-navigation";
import styles from "./installation.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Install Rhoe UI with Tailwind CSS and shadcn",
  description: "Install editable Rhoe UI React components through the shadcn CLI and use either the default Tailwind CSS theme or your existing tokens.",
  path: "/docs/installation",
});

type InstallationStep = {
  title: string;
  description: string;
  code: string;
  language: "bash" | "css" | "json" | "tsx";
  packageCommand?: string;
};

const initializeShadcn = "shadcn@latest init";
const installFoundation = "shadcn@latest add @rhoe/foundation";
const installButton = "shadcn@latest add @rhoe/button";

const configureRegistry = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": {
    "@rhoe": "https://rhoe.syadah.my.id/r/{name}.json"
  }
}`;

const useButton = `import { Button } from "@/components/rhoe/button/button";

export function SaveChanges() {
  return <Button>Save changes</Button>;
}`;

const defaultThemeCss = `/* globals.css */
@import "tailwindcss";
@import "@/components/rhoe/foundation.css";
`;

const tailwindCss = `/* globals.css */
@import "tailwindcss";
@import "@/components/rhoe/foundation.css";
@import "@/components/rhoe/theme-tailwind.css";

/*
 * The adapter automatically maps your existing background, card, muted,
 * foreground, muted-foreground, border, primary, accent,
 * primary-foreground, destructive, destructive-foreground, and ring tokens.
 * Add these optional status tokens only when you want custom status colors.
 */
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

const defaultThemeSteps: InstallationStep[] = [
  {
    title: "Initialize shadcn",
    description: "Initialize shadcn in your React project to configure the registry installer and required aliases.",
    code: initializeShadcn,
    language: "bash",
    packageCommand: initializeShadcn,
  },
  {
    title: "Configure the Rhoe registry",
    description: "Open components.json in the project root, beside package.json, and add the @rhoe namespace. If the file does not exist, run the previous init command from the project root to create it. Keep the other generated fields unchanged.",
    code: configureRegistry,
    language: "json",
  },
  {
    title: "Install Foundation",
    description: "Foundation supplies the shared color, surface, radius, and motion tokens used by every Rhoe UI component.",
    code: installFoundation,
    language: "bash",
    packageCommand: installFoundation,
  },
  {
    title: "Import the default theme",
    description: "Import Tailwind first, then Foundation. Foundation supplies the default Rhoe UI palette, semantic roles, motion tokens, and shared keyframes.",
    code: defaultThemeCss,
    language: "css",
  },
  {
    title: "Add a component",
    description: "The registry copies editable Tailwind source and required dependencies into your project.",
    code: installButton,
    language: "bash",
    packageCommand: installButton,
  },
  {
    title: "Use it",
    description: "Import the installed source through your configured alias and use it like any other React component.",
    code: useButton,
    language: "tsx",
  },
];

const tailwindSteps: InstallationStep[] = [
  {
    title: "Initialize shadcn",
    description: "Initialize shadcn in your React project to configure the registry installer and required aliases.",
    code: initializeShadcn,
    language: "bash",
    packageCommand: initializeShadcn,
  },
  {
    title: "Configure the Rhoe registry",
    description: "Open components.json in the project root, beside package.json, and add the @rhoe namespace. If the file does not exist, run the previous init command from the project root to create it. Keep the other generated fields unchanged.",
    code: configureRegistry,
    language: "json",
  },
  {
    title: "Install Foundation",
    description: "Foundation provides the shared component tokens, while the mapping file connects them to your existing Tailwind or shadcn theme.",
    code: installFoundation,
    language: "bash",
    packageCommand: installFoundation,
  },
  {
    title: "Map your existing tokens",
    description: "Import the adapter after Foundation. It maps the common Tailwind and shadcn semantic tokens automatically; the status tokens shown below are optional overrides.",
    code: tailwindCss,
    language: "css",
  },
  {
    title: "Add a component",
    description: "The registry copies editable Tailwind source and required dependencies into your project.",
    code: installButton,
    language: "bash",
    packageCommand: installButton,
  },
  {
    title: "Use it",
    description: "Import the installed source through your configured alias and use it like any other React component.",
    code: useButton,
    language: "tsx",
  },
];

function InstallationSteps({ steps }: { steps: InstallationStep[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, index) => (
        <li className={styles.step} key={step.title}>
          <span className={styles.marker} aria-hidden="true">{index + 1}</span>
          <div className={styles.stepContent}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {step.packageCommand ? (
              <PackageManagerCommand command={step.packageCommand} />
            ) : (
              <CodeBlock code={step.code} language={step.language} />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InstallationPage() {
  return (
    <>
      <header className={catalogStyles.hero} id="overview">
        <h1>Installation</h1>
        <p className={catalogStyles.lede}>
          Install Rhoe UI as editable Tailwind source files. Choose the default Rhoe
          UI palette or connect components to an existing Tailwind and shadcn theme.
        </p>
        <div className={catalogStyles.meta}>
          <ButtonLink href="#sya-theme" variant="filled">
            Use the default theme
          </ButtonLink>
          <ButtonLink href="#tailwind" variant="bordered">
            Use existing Tailwind
          </ButtonLink>
        </div>
      </header>

      <section className={catalogStyles.section} aria-labelledby="requirements">
        <h2 id="requirements">Requirements</h2>
        <ul className={catalogStyles.bulletList}>
          <li>React 18.3 or later in a React DOM web application.</li>
          <li>Node.js 20.19 or later and a package manager such as pnpm, npm, yarn, or Bun.</li>
          <li>Tailwind CSS v4 and a global stylesheet. The shadcn initializer configures both when needed.</li>
          <li>An <code>@/*</code> import alias for registry source files.</li>
          <li>A modern browser with support for <code>ResizeObserver</code> and the HTML <code>inert</code> attribute.</li>
        </ul>
        <p className={catalogStyles.sectionIntro}>
          Verified with React 18.3 and React 19 on Vite and Next.js. Laravel projects
          using React through Vite or Inertia use the same supported client setup.
        </p>
        <p className={catalogStyles.note}>
          <strong>Recommended:</strong> configure <code>@rhoe</code> once in <code>components.json</code> and install components by name. Direct registry URLs are intended only as a fallback for debugging or environments that cannot read registry namespaces.
        </p>
      </section>

      <section className={catalogStyles.section} aria-labelledby="sya-theme">
        <h2 id="sya-theme">Use Rhoe UI default theme</h2>
        <p className={catalogStyles.sectionIntro}>
          Use this path when you want the supplied neutral Rhoe UI palette. You can
          later override semantic Rhoe variables without changing any component class.
        </p>
        <InstallationSteps steps={defaultThemeSteps} />
      </section>

      <section className={catalogStyles.section} aria-labelledby="tailwind">
        <h2 id="tailwind">Tailwind and shadcn</h2>
        <p className={catalogStyles.sectionIntro}>
          Use this path when your project already has Tailwind or shadcn color
          tokens. The adapter reads those tokens and lets Rhoe UI inherit colors
          without changing their declarations, component shape, or motion.
        </p>
        <InstallationSteps steps={tailwindSteps} />
      </section>

      <PageNavigation items={docsPages} currentHref="/docs/installation" />
    </>
  );
}
