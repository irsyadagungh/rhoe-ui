"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import {
  TableOfContents,
  type TableOfContentsItem,
} from "@/registry/components/table-of-contents/table-of-contents";
import { blockGroups } from "./blocks/block-catalog";
import { catalogItems, type CatalogItem } from "./catalog-data";
import { componentGroups } from "./components/component-catalog";

function catalogPageItems(component: CatalogItem): TableOfContentsItem[] {
  return [
    { id: "overview", label: "Overview" },
    { id: "preview", label: "Preview" },
    ...(component.guidance?.length ? [{ id: "experience", label: "Experience" }] : []),
    { id: "installation", label: "Installation" },
    { id: "usage", label: "Usage" },
    ...(component.examples?.length ? [{ id: "variants", label: "Variants" }] : []),
    ...(component.api?.length ? [{ id: "props", label: "Props" }] : []),
    ...(component.behavior?.length ? [{ id: "motion", label: "Motion" }] : []),
    ...(component.accessibility?.length ? [{ id: "accessibility", label: "Accessibility" }] : []),
    ...(component.customization ? [{ id: "customization", label: "Customization" }] : []),
    { id: "resources", label: "Resources" },
    ...(component.related?.length ? [{ id: "related-components", label: "Related components" }] : []),
  ];
}

const staticPageItems: Record<string, TableOfContentsItem[]> = {
  "/docs": [
    { id: "overview", label: "Overview" },
    { id: "how-it-works", label: "How it works" },
    { id: "first-component", label: "Start with a component" },
  ],
  "/docs/installation": [
    { id: "overview", label: "Overview" },
    { id: "requirements", label: "Requirements" },
    { id: "plain-css", label: "CSS variables" },
    { id: "tailwind", label: "Tailwind and shadcn" },
  ],
  "/docs/theming": [
    { id: "overview", label: "Overview" },
    { id: "color-palette", label: "Color palette" },
    { id: "color-variables", label: "Color variables" },
    { id: "tailwind-mapping", label: "Tailwind mapping" },
    { id: "theme-mode", label: "Theme mode" },
    { id: "custom-theme", label: "Custom theme" },
  ],
  "/docs/motion": [
    { id: "overview", label: "Overview" },
    { id: "css-tokens", label: "CSS and Tailwind" },
    { id: "motion-react", label: "Motion React" },
    { id: "choosing-motion", label: "Choosing motion" },
    { id: "reduced-motion", label: "Reduced motion" },
    { id: "customization", label: "Customization" },
  ],
  "/docs/changelog": [
    { id: "overview", label: "Overview" },
    { id: "releases", label: "Releases" },
  ],
};

function getPageItems(pathname: string) {
  if (pathname === "/components") {
    return [
      { id: "overview", label: "Overview" },
      ...componentGroups.map((group) => ({
        id: group.name.toLocaleLowerCase().replaceAll(" ", "-"),
        label: group.name,
      })),
    ];
  }

  if (pathname === "/blocks") {
    return [
      { id: "overview", label: "Overview" },
      ...blockGroups.map((group) => ({
        id: group.name.toLocaleLowerCase().replaceAll(" ", "-"),
        label: group.name,
      })),
    ];
  }

  const item = catalogItems.find(({ href }) => href === pathname);
  return item ? catalogPageItems(item) : staticPageItems[pathname] ?? [];
}

export function CatalogTableOfContents() {
  const pathname = usePathname();
  const hasMarkdown = /^\/(components|blocks)\/[^/]+$/.test(pathname);

  return (
    <div className="grid gap-5">
      <TableOfContents items={getPageItems(pathname)} />
      {hasMarkdown ? (
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-md text-xs font-[600] text-[var(--text-secondary)] no-underline transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
          href={`${pathname}/markdown`}
          target="_blank"
          rel="noreferrer"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          View as Markdown
        </Link>
      ) : null}
    </div>
  );
}
