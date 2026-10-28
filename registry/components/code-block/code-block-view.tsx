"use client";

import type { CSSProperties } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, ChevronUp, Copy, FileCode2 } from "lucide-react";
import { Button } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

interface CodeBlockViewProps {
  code: string;
  html: string;
  lineCount: number;
  previewLines: number;
  filename?: string;
  variant: "standalone" | "embedded";
  className?: string;
}

export function CodeBlockView({
  code,
  html,
  lineCount,
  previewLines,
  filename,
  variant,
  className,
}: CodeBlockViewProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>();
  const sourceRef = useRef<HTMLDivElement>(null);
  const sourceId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const remainingLines = Math.max(lineCount - previewLines, 0);
  const canExpand = remainingLines > 0;
  const classes = [
    "mt-3 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)]",
    variant === "embedded" && "mt-0 rounded-none border-0",
    className,
  ].filter(Boolean).join(" ");
  const collapsedHeight = previewLines * 21 + 24;
  const sourceStyle = {
    "--code-preview-height": `${previewLines * 1.75}em`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const source = sourceRef.current;
    const content = source?.firstElementChild;
    if (!source || !content) return;

    const measure = () => setContentHeight(source.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [html]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={classes}>
      <div className="flex min-h-[42px] items-center border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3.5 py-2.5 font-mono text-[11px] leading-[17px] text-ellipsis whitespace-nowrap text-[var(--text-secondary)] [&>span]:overflow-hidden [&>span]:text-ellipsis">
          <FileCode2 aria-hidden="true" size={16} />
          <span>{filename ?? "Code"}</span>
        </div>
        <Button
          aria-label="Copy code"
          className="mr-1.5 gap-[7px] whitespace-nowrap"
          onClick={copyCode}
          size="small"
          variant="text"
        >
          {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <motion.div
        ref={sourceRef}
        className={["rhoe-code-source overflow-hidden [&_.shiki]:m-0 [&_.shiki]:overflow-x-auto [&_.shiki]:overflow-y-hidden [&_.shiki]:bg-[var(--surface-muted)] [&_.shiki]:p-2.5 [&_.shiki]:font-mono [&_.shiki]:text-xs [&_.shiki]:leading-[1.75] [&_.shiki]:[tab-size:2] [&_.shiki]:whitespace-normal [&_.shiki]:text-[var(--shiki-light)] [&_.shiki_span]:text-[var(--shiki-light)] [&_.shiki:focus-visible]:outline-2 [&_.shiki:focus-visible]:outline-[var(--focus)] [&_.shiki:focus-visible]:outline-offset-[-3px] [&_.line]:relative [&_.line]:block [&_.line]:min-h-[1.75em] [&_.line]:pl-10 [&_.line]:whitespace-pre [&_.line-number]:absolute [&_.line-number]:top-0 [&_.line-number]:left-0 [&_.line-number]:w-[1.875rem] [&_.line-number]:text-right [&_.line-number]:text-[var(--text-secondary)] [&_.line-number]:select-none max-[760px]:[&_.shiki]:px-2 max-[760px]:[&_.shiki]:py-2 max-[760px]:[&_.line]:pl-9", variant === "embedded" && "[&_.shiki]:min-h-[250px]"].join(" ")}
        data-collapsed={canExpand && !expanded || undefined}
        id={sourceId}
        style={sourceStyle}
        initial={false}
        animate={{ height: canExpand ? expanded ? contentHeight ?? "auto" : collapsedHeight : "auto" }}
        transition={reduceMotion
          ? { duration: 0.01 }
          : { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {canExpand ? (
        <div className="flex min-h-9 items-center justify-center border-t border-[var(--border)] bg-[var(--surface)]">
          <Button
            aria-controls={sourceId}
            aria-expanded={expanded}
            className="gap-[7px] text-[var(--text-secondary)]"
            onClick={() => setExpanded((current) => !current)}
            size="small"
            variant="text"
          >
            {expanded
              ? <><ChevronUp aria-hidden="true" size={15} /> Show fewer lines</>
              : <><ChevronDown aria-hidden="true" size={15} /> Show all {lineCount} lines</>}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
