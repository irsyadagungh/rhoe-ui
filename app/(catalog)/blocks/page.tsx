import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { ButtonLink } from "@/registry/components/button/button";
import { blockGroups } from "./block-catalog";
import styles from "../catalog.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "React UI Blocks",
  description: "Explore open-source React UI blocks composed from Rhoe UI components, with editable Tailwind CSS source and built-in motion.",
  path: "/blocks",
});

export default function Blocks() {
  return (
    <>
      <header className={styles.hero} id="overview">
        <p className={styles.eyebrow}>Blocks</p>
        <h1>Block catalog</h1>
        <p className={styles.lede}>
          Composed product patterns that combine Rhoe UI primitives into complete interfaces.
        </p>
      </header>

      {blockGroups.map((group) => (
        <section className={styles.section} aria-labelledby={group.name.toLowerCase().replaceAll(" ", "-")} key={group.name}>
          <h2 id={group.name.toLowerCase().replaceAll(" ", "-")}>{group.name}</h2>
          <p className={styles.sectionIntro}>{group.description}</p>
          <div className={styles.relatedLinks}>
            {group.blocks.map((block) => (
              <ButtonLink key={block.name} variant="bordered" href={block.href}>
                {block.title}
              </ButtonLink>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
