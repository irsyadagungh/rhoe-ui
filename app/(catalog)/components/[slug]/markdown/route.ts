import { markdownFor } from "../../../catalog-markdown";
import { getComponentCatalogItem } from "../../component-catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const component = getComponentCatalogItem((await params).slug);

  if (!component) return new Response("Not found", { status: 404 });

  return new Response(markdownFor(component), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
