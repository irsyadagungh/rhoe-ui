import Link from "next/link";
import type { ReactNode } from "react";
import { CatalogNav } from "./catalog-nav";
import { CatalogMobileNav } from "./catalog-mobile-nav";
import { ComponentSearch } from "./component-search";
import { CatalogTableOfContents } from "./catalog-table-of-contents";
import { ThemeSwitcher } from "./theme-switcher";
import styles from "./catalog.module.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <CatalogMobileNav />
        <Link className={styles.brand} href="/">
          <span className={styles.brandLogo} aria-hidden="true" />
          Rhoe
        </Link>
        <div className={styles.topSearch}>
          <ComponentSearch />
        </div>
        <nav className={styles.topActions} aria-label="Primary navigation">
          <ThemeSwitcher />
          <div className={styles.mobileSearch}>
            <ComponentSearch compact />
          </div>
          <Link className={styles.toplink} href="/components">
            Components
          </Link>
          <Link className={styles.toplink} href="/blocks">
            Blocks
          </Link>
        </nav>
      </header>

      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <CatalogNav />
        </aside>
        <main className={styles.content}>{children}</main>
        <aside className={styles.pageSidebar}>
          <CatalogTableOfContents />
        </aside>
      </div>
    </div>
  );
}
