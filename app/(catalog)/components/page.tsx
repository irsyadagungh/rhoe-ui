import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { componentGroups } from "./component-catalog";
import styles from "../catalog.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Animated React Components",
  description: "Explore open-source animated React components for Tailwind CSS, with live previews, accessible APIs, and shadcn CLI installation.",
  path: "/components",
});

export default function Components() {
  return (
    <>
      <header className={styles.hero} id="overview">
        <p className={styles.eyebrow}>Components</p>
        <h1>Component catalog</h1>
        <p className={styles.lede}>
          Reusable interface primitives with live examples, installation commands,
          and complete API references.
        </p>
      </header>

      {componentGroups.map((group) => (
        <section className={styles.section} aria-labelledby={group.name.toLowerCase().replaceAll(" ", "-")} key={group.name}>
          <h2 id={group.name.toLowerCase().replaceAll(" ", "-")}>{group.name}</h2>
          <p className={styles.sectionIntro}>{group.description}</p>
          <ul className={styles.componentList}>
            {group.components.map((component) => (
              <li key={component.name}>
                <Link className={styles.componentLink} href={component.href}>
                  <span>{component.title}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
