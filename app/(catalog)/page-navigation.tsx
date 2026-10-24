import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./catalog.module.css";

type NavigationItem = {
  href: string;
  title: string;
};

export const docsPages = [
  { href: "/docs", title: "Introduction" },
  { href: "/docs/installation", title: "Installation" },
  { href: "/docs/theming", title: "Theming" },
  { href: "/docs/motion", title: "Motion" },
  { href: "/docs/changelog", title: "Changelog" },
] as const;

export function PageNavigation({
  items,
  currentHref,
}: {
  items: readonly NavigationItem[];
  currentHref: string;
}) {
  const currentIndex = items.findIndex((item) => item.href === currentHref);
  if (currentIndex < 0) return null;

  const previous = items[currentIndex - 1];
  const next = items[currentIndex + 1];

  return (
    <nav className={styles.pageNavigation} aria-label="Page navigation">
      {previous ? (
        <Link className={styles.pageNavigationLink} data-direction="previous" href={previous.href}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span><small>Previous</small>{previous.title}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link className={styles.pageNavigationLink} data-direction="next" href={next.href}>
          <span><small>Next</small>{next.title}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
