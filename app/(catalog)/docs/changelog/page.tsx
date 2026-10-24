import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import changelog from "@/data/changelog.json";
import catalogStyles from "../../catalog.module.css";
import styles from "./changelog.module.css";
import { docsPages, PageNavigation } from "../../page-navigation";

export const metadata: Metadata = createPageMetadata({
  title: "Rhoe UI Changelog",
  description: "Follow new animated React components, UI blocks, improvements, and bug fixes released in the open-source Rhoe UI registry.",
  path: "/docs/changelog",
});

const changeLabels: Record<string, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function ChangelogPage() {
  return (
    <>
      <header className={catalogStyles.hero} id="overview">
        <p className={catalogStyles.eyebrow}>Docs / Changelog</p>
        <h1>Changelog</h1>
        <p className={catalogStyles.lede}>
          New components, meaningful improvements, and fixes across Rhoe UI.
          Release data is maintained in a JSON file so it can later be managed
          through the admin application.
        </p>
      </header>

      <section className={catalogStyles.section} aria-labelledby="releases">
        <h2 id="releases">Releases</h2>
        <div className={styles.releases}>
          {changelog.releases.map((release) => (
            <article className={styles.release} key={release.date}>
              <h3 className={styles.dateHeading}>
                <time dateTime={release.date}>{formatDate(release.date)}</time>
              </h3>
              <div className={styles.releaseContent}>
                <h4>{release.title}</h4>
                <p className={styles.summary}>{release.summary}</p>
                {release.changes.map((group) => (
                  <div className={styles.changeGroup} key={group.type}>
                    <h4>{changeLabels[group.type] ?? group.type}</h4>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.text}>
                          <span>{item.text}</span>
                          {item.components.length || item.blocks.length ? (
                            <span className={styles.pills}>
                              {item.components.map((component) => (
                                <span className={styles.pill} data-kind="component" key={component}>
                                  {component}
                                </span>
                              ))}
                              {item.blocks.map((block) => (
                                <span className={styles.pill} data-kind="block" key={block}>
                                  {block}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <PageNavigation items={docsPages} currentHref="/docs/changelog" />
    </>
  );
}
