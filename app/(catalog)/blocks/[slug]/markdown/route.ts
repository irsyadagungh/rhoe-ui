import { markdownFor } from "../../../catalog-markdown";
import { getBlockCatalogItem } from "../../block-catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const block = getBlockCatalogItem((await params).slug);

  if (!block) return new Response("Not found", { status: 404 });

  return new Response(markdownFor(block), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
