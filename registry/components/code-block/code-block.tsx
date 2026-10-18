"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeBlockView } from "./code-block-view";

export interface CodeBlockProps {
  code: string;
  language?: "bash" | "css" | "html" | "javascript" | "json" | "tsx" | "typescript";
  filename?: string;
  variant?: "standalone" | "embedded";
  className?: string;
  previewLines?: number;
}

type ShikiModule = typeof import("shiki");
type Highlighter = Awaited<ReturnType<ShikiModule["createHighlighter"]>>;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighterPromise ??= import("shiki").then(({ createHighlighter }) => createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["bash", "css", "html", "javascript", "json", "tsx", "typescript"],
  }));

  return highlighterPromise;
}

export function CodeBlock({
  code,
  language = "tsx",
  filename,
  variant = "standalone",
  className,
  previewLines = 18,
}: CodeBlockProps) {
  const source = useMemo(() => code.trim(), [code]);
  const [highlighted, setHighlighted] = useState<{ source: string; html: string }>();
  const html = highlighted?.source === source ? highlighted.html : plainCodeToHtml(source);

  useEffect(() => {
    let active = true;

    getHighlighter().then((highlighter) => {
      if (!active) return;
      setHighlighted({
        source,
        html: withLineNumbers(highlighter.codeToHtml(source, {
          lang: language,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        })),
      });
    });

    return () => {
      active = false;
    };
  }, [language, source]);

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

function plainCodeToHtml(code: string) {
  const lines = escapeHtml(code).split("\n").map(
    (line, index) => `<span class="line"><span aria-hidden="true" class="line-number">${index + 1}</span>${line || " "}</span>`,
  ).join("");

  return `<pre class="shiki" tabindex="0"><code>${lines}</code></pre>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function withLineNumbers(html: string) {
  let line = 0;

  return html.replaceAll(
    '<span class="line">',
    () =>
      `<span class="line"><span aria-hidden="true" class="line-number">${++line}</span>`,
  );
}
