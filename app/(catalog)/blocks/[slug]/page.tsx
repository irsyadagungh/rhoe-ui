import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { CatalogDocument } from "../../catalog-document";
import { blockCatalog, getBlockCatalogItem } from "../block-catalog";

export function generateStaticParams() {
  return blockCatalog.map(({ name }) => ({ slug: name }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const block = getBlockCatalogItem(slug);
  return block
    ? createPageMetadata({
        title: `${block.title} React UI Block`,
        description: `${block.description} View the live example, API reference, and shadcn CLI installation.`,
        path: `/blocks/${slug}`,
      })
    : {};
}

async function BlockPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const block = getBlockCatalogItem((await params).slug);
  if (!block) notFound();
  return <CatalogDocument component={block} />;
}

export default function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={null}><BlockPageContent params={params} /></Suspense>;
}
