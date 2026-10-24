import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { ButtonLink } from "@/registry/components/button/button";
import { docsPages, PageNavigation } from "../page-navigation";
import styles from "../catalog.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Introduction to Rhoe UI",
  description: "Discover Rhoe UI, an open-source animated React component registry inspired by the Ancient Greek idea of flow and purposeful interface motion.",
  path: "/docs",
});

export default function DocsIntroduction() {
  return (
    <>
      <header className={styles.hero} id="overview">
        <p className={styles.eyebrow}>Docs / Introduction</p>
        <h1>Introduction</h1>
        <p className={styles.lede}>
          Rhoe UI is an open-source registry of editable React components built
          for interfaces that move with clarity, continuity, and purpose.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="what-is-rhoe-ui">
        <h2 id="what-is-rhoe-ui">What is Rhoe UI?</h2>
        <p className={styles.sectionIntro}>
          Rhoe UI combines accessible React behavior, Tailwind CSS styling, and
          considered motion in components that you install through the shadcn CLI.
          The source is copied into your project, so you can read it, adapt it,
          and make it part of your own design system.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="the-name">
        <h2 id="the-name">The name</h2>
        <p className={styles.sectionIntro}>
          Rhoe is inspired by the Ancient Greek word <span lang="grc">ῥοή</span>
          {" "}(<i>rhoḗ</i>), meaning flow, stream, or current. The word comes from
          {" "}<span lang="grc">ῥέω</span> (<i>rhéō</i>), “to flow.” It reflects
          the idea that an interface should preserve continuity as it changes,
          allowing one state to flow naturally into the next.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="philosophy">
        <h2 id="philosophy">The philosophy</h2>
        <p className={styles.sectionIntro}>
          Motion in Rhoe UI communicates relationships between states. A trigger
          can become the surface it opens, text can retain its spatial rhythm as
          it changes, and expanding content can remain anchored to its origin.
          Animation supports understanding rather than decorating the interface.
        </p>
        <ul className={styles.bulletList}>
          <li>Continuity: state changes preserve visual and spatial context.</li>
          <li>Ownership: installed components remain editable application code.</li>
          <li>Restraint: motion appears where it explains change or confirms action.</li>
          <li>Adaptability: components inherit shared tokens without locking their structure.</li>
          <li>Accessibility: semantics, keyboard behavior, and reduced motion remain foundational.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="start-building">
        <h2 id="start-building">Start building</h2>
        <p className={styles.sectionIntro}>
          Begin with the installation guide, or browse the component catalog for
          live previews, complete usage examples, API references, and editable source.
        </p>
        <div className={styles.relatedLinks}>
          <ButtonLink variant="filled" href="/docs/installation">
            Install Rhoe UI
          </ButtonLink>
          <ButtonLink variant="bordered" href="/components">
            Browse components
          </ButtonLink>
        </div>
      </section>

      <PageNavigation items={docsPages} currentHref="/docs" />
    </>
  );
}
