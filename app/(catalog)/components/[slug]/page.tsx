import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { CatalogDocument } from "../../catalog-document";
import { componentCatalog, getComponentCatalogItem } from "../component-catalog";

export function generateStaticParams() {
  return componentCatalog.map(({ name }) => ({ slug: name }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const component = getComponentCatalogItem(slug);
  return component
    ? createPageMetadata({
        title: `${component.title} React Component`,
        description: `${component.description} View live examples, the API reference, and shadcn CLI installation.`,
        path: `/components/${slug}`,
      })
    : {};
}

async function ComponentPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = getComponentCatalogItem(slug);
  if (!component) notFound();
  return <CatalogDocument component={component} />;
}

export default function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={null}><ComponentPageContent params={params} /></Suspense>;
}
