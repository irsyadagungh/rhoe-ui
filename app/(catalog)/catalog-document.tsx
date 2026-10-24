import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { githubUrl, threadsUrl } from "@/lib/site-url";
import { Badge } from "@/registry/components/badge/badge";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import { ComponentPreview } from "./components/component-preview";
import { MarkdownDownload } from "./components/copy-for-ai";
import { getCatalogItem, type CatalogItem } from "./catalog-data";
import { markdownFor } from "./catalog-markdown";
import { getComponentPreview } from "./components/component-preview-map";
import { InstallationCommand } from "./components/installation-command";
import { readRegistrySource } from "./components/registry-source";
import { blockCatalog } from "./blocks/block-catalog";
import { componentCatalog } from "./components/component-catalog";
import { PageNavigation } from "./page-navigation";
import styles from "./catalog.module.css";

function BulletList({ items }: { items: string[] }) {
  return <ul className={styles.bulletList}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function ExperienceList({ items }: { items: string[] }) {
  return <ol className={styles.experienceList}>{items.map((item, index) => (
    <li key={item}>
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <p>{item}</p>
    </li>
  ))}</ol>;
}

export function CatalogDocument({ component }: { component: CatalogItem }) {
  const preview = getComponentPreview(component.name);
  const source = readRegistrySource(component.sourcePath);
  const related = (component.related ?? [])
    .map(getCatalogItem)
    .filter((item): item is CatalogItem => Boolean(item));
  const siblings = component.section === "Components" ? componentCatalog : blockCatalog;

  return (
    <article className={styles.catalogDocument}>
      <header className={styles.hero} id="overview">
        <p className={styles.eyebrow}>
          {component.section} / {component.group}
        </p>
        <h1>{component.title}</h1>
        <p className={styles.lede}>{component.lede}</p>
      </header>

      <section className={styles.section} aria-labelledby="preview">
        <h2 id="preview">Preview</h2>
        <ComponentPreview code={source} filename={component.sourcePath} {...preview} />
      </section>

      {component.guidance?.length ? <section className={styles.section} aria-labelledby="experience">
        <h2 id="experience">Experience</h2>
        <ExperienceList items={component.guidance} />
      </section> : null}

      <section className={styles.section} aria-labelledby="installation">
        <h2 id="installation">Installation</h2>
        {component.installation ? <p className={styles.sectionIntro}>{component.installation}</p> : null}
        <InstallationCommand registry={component.name} />
      </section>

      <section className={styles.section} aria-labelledby="usage">
        <h2 id="usage">Usage</h2>
        <CodeBlock code={component.usage} language="tsx" />
      </section>

      {component.examples?.length ? <section className={styles.section} aria-labelledby="variants">
        <h2 id="variants">Variants</h2>
        {component.examples.map((example, index) => <div key={`${example.title ?? "example"}-${index}`}>
          {example.title ? <h3 className={styles.subheading}>{example.title}</h3> : null}
          {example.description ? <p className={styles.sectionIntro}>{example.description}</p> : null}
          <CodeBlock code={example.code} language="tsx" />
        </div>)}
      </section> : null}

      {component.api?.length ? <section className={styles.section} aria-labelledby="props">
        <h2 id="props">Props</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>{component.api.map(([prop, type, defaultValue, description, required]) => <tr key={prop}>
              <td>
                <span className="inline-flex flex-wrap items-center gap-2">
                  {prop}
                  {required ? <Badge variant="bordered" tone="warning">Required</Badge> : null}
                </span>
              </td>
              <td>{type}</td>
              <td>{defaultValue}</td>
              <td>{description}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section> : null}

      {component.behavior?.length ? <section className={styles.section} aria-labelledby="motion">
        <h2 id="motion">Motion</h2>
        <BulletList items={component.behavior} />
      </section> : null}

      {component.accessibility?.length ? <section className={styles.section} aria-labelledby="accessibility">
        <h2 id="accessibility">Accessibility</h2>
        <BulletList items={component.accessibility} />
      </section> : null}

      {component.customization ? <section className={styles.section} aria-labelledby="customization">
        <h2 id="customization">Customization</h2>
        <p className={styles.sectionIntro}>{component.customization}</p>
      </section> : null}

      <section className={styles.section} aria-labelledby="resources">
        <h2 id="resources">Resources</h2>
        {component.files?.length ? <div className={styles.resourceGroup}>
          <h3>Installed files</h3>
          <ul className={styles.fileList}>{component.files.map((file) => <li key={file}>{file}</li>)}</ul>
        </div> : null}
        <aside className={`${styles.aiNote} ${styles.resourceNote}`} aria-labelledby="markdown-for-ai">
          <div><h3 id="markdown-for-ai">Markdown for AI</h3><p>Download a compact Markdown reference with usage, motion behavior, accessibility notes, and props.</p></div>
          <MarkdownDownload markdown={markdownFor(component)} filename={`${component.name}.md`} />
        </aside>
      </section>

      {related.length ? <section className={styles.section} aria-labelledby="related-components">
        <h2 id="related-components">Related components</h2>
        <div className={styles.relatedLinks}>{related.map((item) => (
          <Link className={styles.relatedLink} key={item.name} href={item.href}>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ))}</div>
      </section> : null}

      <aside className={styles.requestCta}>
        <div>
          <p className={styles.requestCtaEyebrow}>Shape the registry</p>
          <h2>Looking for a component?</h2>
          <p>Send a DM on Threads for component ideas, or open a GitHub issue when something is not working.</p>
        </div>
        <div className={styles.requestCtaActions}>
          <a href={`${githubUrl}/issues/new`} target="_blank" rel="noreferrer">
            GitHub issue
            <ArrowUpRight aria-hidden="true" />
          </a>
          <a data-primary href={threadsUrl} target="_blank" rel="noreferrer">
            DM on Threads
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </aside>

      <PageNavigation items={siblings} currentHref={component.href} />
    </article>
  );
}
