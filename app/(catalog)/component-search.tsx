"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Boxes, Component } from "lucide-react";
import {
  ExpandingSearch,
  type ExpandingSearchItem,
} from "@/registry/components/expanding-search/expanding-search";
import { blockCatalog } from "./blocks/block-catalog";
import { componentCatalog } from "./components/component-catalog";

function rankComponentResults(items: ExpandingSearchItem[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return items;

  return items
    .map((item, index) => {
      const label = typeof item.label === "string" ? item.label : "";
      const description = typeof item.description === "string" ? item.description : "";
      const keywords = item.keywords ?? [];
      const haystack = [item.value, item.group ?? "", label, description, ...keywords]
        .join(" ")
        .toLocaleLowerCase();
      if (!haystack.includes(normalizedQuery)) return null;

      const score = label.toLocaleLowerCase() === normalizedQuery ? 4
        : label.toLocaleLowerCase().startsWith(normalizedQuery) ? 3
          : keywords.some((keyword) => keyword.toLocaleLowerCase().startsWith(normalizedQuery)) ? 2
            : 1;
      return { item, index, score };
    })
    .filter((result): result is { item: ExpandingSearchItem; index: number; score: number } => result !== null)
    .sort((left, right) => left.item.group === right.item.group
      ? right.score - left.score || left.index - right.index
      : left.index - right.index)
    .map(({ item }) => item);
}

export function ComponentSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [mobileWidth, setMobileWidth] = useState(360);

  useEffect(() => {
    if (!compact) return;
    const updateWidth = () => setMobileWidth(Math.max(280, window.innerWidth - 24));
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [compact]);

  const items = useMemo<ExpandingSearchItem[]>(() => [
    {
      value: "/docs",
      label: "Introduction",
      description: "Install and use components from the Rhoe UI registry.",
      group: "Docs",
      icon: <BookOpen size={16} />,
      keywords: ["documentation", "introduction", "getting started", "registry"],
    },
    {
      value: "/docs/theming",
      label: "Theming",
      description: "Color tokens, light and dark palettes, and custom themes.",
      group: "Docs",
      icon: <BookOpen size={16} />,
      keywords: ["theme", "color", "tokens", "light", "dark"],
    },
    {
      value: "/docs/installation",
      label: "Installation",
      description: "Set up Rhoe UI with plain CSS or Tailwind and shadcn tokens.",
      group: "Docs",
      icon: <BookOpen size={16} />,
      keywords: ["install", "css", "tailwind", "shadcn", "foundation", "setup"],
    },
    {
      value: "/docs/motion",
      label: "Motion",
      description: "Durations, easing curves, springs, stagger, and reduced motion.",
      group: "Docs",
      icon: <BookOpen size={16} />,
      keywords: ["motion", "animation", "transition", "spring", "easing", "duration", "stagger"],
    },
    {
      value: "/docs/changelog",
      label: "Changelog",
      description: "Release history, new components, improvements, and fixes.",
      group: "Docs",
      icon: <BookOpen size={16} />,
      keywords: ["changelog", "release", "version", "updates", "history"],
    },
    ...componentCatalog.map((component) => ({
      value: component.href,
      label: component.title,
      description: component.description,
      group: "Components",
      icon: <Component size={16} />,
      keywords: [component.name, component.description, ...component.keywords],
    })),
    ...blockCatalog.map((block) => ({
      value: block.href,
      label: block.title,
      description: block.description,
      group: "Blocks",
      icon: <Boxes size={16} />,
      keywords: [block.name, block.description, ...block.keywords],
    })),
  ], []);

  return (
    <ExpandingSearch
      className="catalog-component-search [&_input]:overflow-hidden [&_input]:text-ellipsis [&_input]:whitespace-nowrap [&_[data-input-value]]:block [&_[data-input-value]]:min-w-0 [&_[data-input-value]]:overflow-hidden [&_[data-input-value]]:text-ellipsis [&_[data-input-value]]:whitespace-nowrap"
      trigger={compact ? "icon" : "field"}
      panelSize="xl"
      expandedWidth={compact ? mobileWidth : undefined}
      backdrop
      triggerLabel="Search documentation, components, and blocks"
      triggerAriaLabel="Search documentation, components, and blocks"
      anchor={compact ? "end" : "center"}
      items={items}
      animatedListProps={{ dense: true, replay: "never", stagger: 0 }}
      itemProps={() => ({ descriptionPlacement: "inline" })}
      filterItems={rankComponentResults}
      onScroll={(event) => {
        event.currentTarget.scrollLeft = 0;
      }}
      onItemSelect={(item) => router.push(item.value)}
      placeholder="Search documentation, components, and blocks"
      emptyState="No documentation, components, or blocks match that search."
      resultsLabel="Documentation, component, and block search results"
    />
  );
}
