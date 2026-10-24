"use client";

import { useState, type MouseEvent } from "react";
import { Code2, Eye } from "lucide-react";
import { SidebarNavigation } from "@/registry/components/sidebar-navigation/sidebar-navigation";
import { TableOfContents } from "@/registry/components/table-of-contents/table-of-contents";
import { Tabs } from "@/registry/components/tabs/tabs";
import styles from "../../catalog.module.css";

const sidebarGroups = [
  {
    label: "Components",
    count: 2,
    items: [
      {
        label: "Navigation",
        count: 2,
        defaultExpanded: true,
        children: [
          {
            href: "/components/sidebar-navigation",
            label: "Sidebar Navigation",
          },
          {
            href: "/components/table-of-contents",
            label: "Table of Contents",
          },
        ],
      },
    ],
  },
];

const tableOfContentsItems = [
  { id: "overview", label: "Overview" },
  { id: "preview", label: "Preview" },
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "api-reference", label: "API reference" },
];

export function NavigationExample({
  type,
  tabsVariant = "grouped-text",
}: {
  type: "sidebar" | "table-of-contents" | "tabs";
  tabsVariant?: "flat-text" | "flat-icon" | "grouped-text" | "grouped-icon";
}) {
  const [activeHref, setActiveHref] = useState(
    "/components/sidebar-navigation",
  );
  const keepPreviewInPlace = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a")) event.preventDefault();
  };

  if (type === "sidebar") {
    return (
      <div
        className={styles.navigationPreview}
        onClickCapture={keepPreviewInPlace}
      >
        <SidebarNavigation
          groups={sidebarGroups}
          activeHref={activeHref}
          onActiveHrefChange={setActiveHref}
          ariaLabel="Example navigation"
        />
      </div>
    );
  }

  if (type === "tabs") {
    const withIcon = tabsVariant.endsWith("icon");
    const variant = tabsVariant.startsWith("grouped") ? "grouped" : "flat";

    return (
      <div className={styles.tabsPreview}>
        <Tabs
          variant={variant}
          ariaLabel="Example tabs"
          items={[
            {
              value: "overview",
              label: "Overview",
              icon: withIcon ? <Eye size={15} /> : undefined,
              content: (
                <p className={styles.tabExamplePanel}>
                  A concise summary of the selected view.
                </p>
              ),
            },
            {
              value: "activity",
              label: "Activity",
              icon: withIcon ? <Code2 size={15} /> : undefined,
              content: (
                <p className={styles.tabExamplePanel}>
                  Recent changes appear in this panel.
                </p>
              ),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.navigationPreview}
      onClickCapture={keepPreviewInPlace}
    >
      <TableOfContents
        items={tableOfContentsItems}
        ariaLabel="Example table of contents"
      />
    </div>
  );
}
