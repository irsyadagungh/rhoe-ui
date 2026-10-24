import rawCatalog from "./component-catalog.json";
import type { CatalogDocument } from "../catalog-types";

export interface ComponentGroup {
  name: string;
  description: string;
  components: CatalogDocument[];
}

const catalog = rawCatalog as { groups: ComponentGroup[] };

export type ComponentCatalogItem = CatalogDocument & {
  group: string;
  section: "Components";
  href: `/components/${string}`;
};

export const componentGroups = catalog.groups.map((group) => ({
  ...group,
  components: group.components.map((component) => ({
    ...component,
    group: group.name,
    section: "Components" as const,
    href: `/components/${component.name}` as const,
  })),
}));

export const componentCatalog = componentGroups.flatMap((group) => group.components);

export function getComponentCatalogItem(name: string) {
  return componentCatalog.find((component) => component.name === name);
}
