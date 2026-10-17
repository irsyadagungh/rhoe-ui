import { CodeBlockView } from "./code-block-view";
import { createHighlighter } from "shiki";

export interface CodeBlockProps {
  code: string;
  language?: "bash" | "css" | "html" | "javascript" | "json" | "tsx" | "typescript";
  filename?: string;
  variant?: "standalone" | "embedded";
  className?: string;
  previewLines?: number;
}

const highlighter = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["bash", "css", "html", "javascript", "json", "tsx", "typescript"],
});

export async function CodeBlock({
  code,
  language = "tsx",
  filename,
  variant = "standalone",
  className,
  previewLines = 18,
}: CodeBlockProps) {
  "use cache";

  const source = code.trim();
  const html = withLineNumbers((await highlighter).codeToHtml(source, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  }));

  return (
    <CodeBlockView
      className={className}
      code={source}
      filename={filename}
      html={html}
      lineCount={source.split("\n").length}
      previewLines={Math.max(1, Math.floor(previewLines))}
      variant={variant}
    />
  );
}

function withLineNumbers(html: string) {
  let line = 0;

  return html.replaceAll(
    '<span class="line">',
    () =>
      `<span class="line"><span aria-hidden="true" class="line-number">${++line}</span>`,
  );
}
