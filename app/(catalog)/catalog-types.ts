export type ApiRow = [string, string, string, string, boolean?];

export interface CatalogDocument {
  name: string;
  title: string;
  description: string;
  lede: string;
  keywords: string[];
  sourcePath: string;
  /** Preview mode for Studio bulk import; free items are INLINE, special are IFRAME. */
  previewType?: "INLINE" | "IFRAME" | string | null;
  previewKey?: string | null;
  installation?: string;
  usage: string;
  examples?: Array<{ title?: string; description?: string; code: string }>;
  guidance?: string[];
  behavior?: string[];
  accessibility?: string[];
  api?: ApiRow[];
  customization?: string;
  files?: string[];
  related?: string[];
}
