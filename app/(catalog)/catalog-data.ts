import { blockCatalog, type BlockCatalogItem } from "./blocks/block-catalog";
import { componentCatalog, type ComponentCatalogItem } from "./components/component-catalog";

export type CatalogItem = ComponentCatalogItem | BlockCatalogItem;

export const catalogItems: CatalogItem[] = [...componentCatalog, ...blockCatalog];

export function getCatalogItem(name: string) {
  return catalogItems.find((item) => item.name === name);
}
