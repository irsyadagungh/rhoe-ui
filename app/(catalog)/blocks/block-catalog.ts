import rawCatalog from "./block-catalog.json";
import type { CatalogDocument } from "../catalog-types";

interface BlockGroup {
  name: string;
  description: string;
  blocks: CatalogDocument[];
}

const catalog = rawCatalog as { groups: BlockGroup[] };

export type BlockCatalogItem = CatalogDocument & {
  group: string;
  section: "Blocks";
  href: `/blocks/${string}`;
};

export const blockGroups = catalog.groups.map((group) => ({
  ...group,
  blocks: group.blocks.map((block) => ({
    ...block,
    group: group.name,
    section: "Blocks" as const,
    href: `/blocks/${block.name}` as const,
  })),
}));

export const blockCatalog = blockGroups.flatMap((group) => group.blocks);

export function getBlockCatalogItem(name: string) {
  return blockCatalog.find((block) => block.name === name);
}
