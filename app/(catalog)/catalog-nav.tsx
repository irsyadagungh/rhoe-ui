"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNavigation } from "@/registry/components/sidebar-navigation/sidebar-navigation";
import { blockCatalog, blockGroups } from "./blocks/block-catalog";
import { componentGroups, componentCatalog } from "./components/component-catalog";
import { docsPages } from "./page-navigation";

const groups = [
  {
    label: "Docs",
    items: docsPages.map(({ href, title }) => ({ href, label: title })),
  },
  {
    label: "Components",
    count: componentCatalog.length,
    items: componentGroups.map((group) => ({
      label: group.name,
      count: group.components.length,
      defaultExpanded: true,
      children: group.components.map(({ href, title }) => ({ href, label: title })),
    })),
  },
  {
    label: "Blocks",
    count: blockCatalog.length,
    items: blockGroups.map((group) => ({
      label: group.name,
      count: group.blocks.length,
      defaultExpanded: true,
      children: group.blocks.map(({ href, title }) => ({ href, label: title })),
    })),
  },
];

export function CatalogNav() {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState(pathname);

  useEffect(() => {
    const updateActiveHref = () => {
      setActiveHref(`${window.location.pathname}${window.location.hash}`);
    };

    updateActiveHref();
    window.addEventListener("hashchange", updateActiveHref);
    window.addEventListener("popstate", updateActiveHref);
    return () => {
      window.removeEventListener("hashchange", updateActiveHref);
      window.removeEventListener("popstate", updateActiveHref);
    };
  }, [pathname]);

  return (
    <SidebarNavigation
      groups={groups}
      activeHref={activeHref}
      onActiveHrefChange={setActiveHref}
      renderLink={Link}
    />
  );
}
