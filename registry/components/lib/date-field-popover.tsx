"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { motionTokens } from "./motion-tokens";
import "../foundation.css";

export interface DateFieldPopoverProps {
  label?: ReactNode;
  valueText?: string;
  placeholder: string;
  ariaLabel?: string;
  disabled?: boolean;
  errorMessage?: ReactNode;
  variant?: "filled" | "bordered";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  calendarWidth?: "full" | "three-quarter" | number;
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
}

export function DateFieldPopover({
  label,
  valueText,
  placeholder,
  ariaLabel,
  disabled = false,
  errorMessage,
  variant = "filled",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  calendarWidth = "full",
  children,
}: DateFieldPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(432);
  const [panelWidth, setPanelWidth] = useState(320);
  const [fieldWidth, setFieldWidth] = useState(320);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasExpandedRef = useRef(false);
  const labelId = useId();
  const contentId = useId();
  const expanded = open ?? internalOpen;

  const setExpanded = useCallback((next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange, open]);

  const close = useCallback(() => {
    setExpanded(false);
  }, [setExpanded]);

  useEffect(() => {
    if (wasExpandedRef.current && !expanded) {
      inputRef.current?.focus({ preventScroll: true });
    }
    wasExpandedRef.current = expanded;
  }, [expanded]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => setContentHeight(content.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setFieldWidth(root.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setPanelWidth(panel.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, expanded, setExpanded]);

  const toggle = () => {
    if (!disabled) setExpanded(!expanded);
  };
  const narrower = panelWidth < fieldWidth - 1;
  const surface = variant === "filled" ? "var(--surface-muted)" : "color-mix(in srgb, var(--surface-muted) 58%, var(--surface))";

  return (
    <div
      ref={rootRef}
      className={["group relative z-0 w-full data-[open]:z-[120]", className].filter(Boolean).join(" ")}
      data-open={expanded || undefined}
    >
      {label && typeof label !== "string" ? (
        <span id={labelId} className="mb-2 block text-[13px] font-[620] leading-[1.4] text-[var(--text)]">{label}</span>
      ) : null}
      <Input
        ref={inputRef}
        className={[
          "[&_input]:cursor-pointer [&_input:focus-visible]:!outline-2 [&_input:focus-visible]:!outline-[var(--focus)] [&_input:focus-visible]:!outline-offset-[-2px] [&>div>div:first-child]:transition-[border-radius,border-color] [&>div>div:first-child]:duration-[var(--duration-standard)]",
          expanded && "[&>div>div:first-child]:!rounded-bl-none [&>div>div:first-child]:!border-transparent [&>div>div:first-child]:focus-within:!border-transparent",
          expanded && !narrower && "[&>div>div:first-child]:!rounded-br-none",
        ].filter(Boolean).join(" ")}
        label={typeof label === "string" ? label : undefined}
        value={valueText ?? ""}
        placeholder={placeholder}
        variant={variant}
        disabled={disabled}
        error={errorMessage}
        readOnly
        clearable={false}
        aria-label={ariaLabel}
        aria-labelledby={label && typeof label !== "string" ? labelId : undefined}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={contentId}
        prefixIcon={<CalendarDays />}
        suffixControl={(
          <Button
            className="min-h-[34px] w-[34px] shrink-0 basis-[34px] rounded-full p-0 [&_svg]:size-3.5 [&_svg]:transition-[rotate] [&_svg]:duration-[var(--duration-standard)] [&_svg]:ease-[var(--ease-standard)] motion-reduce:[&_svg]:duration-[0.01ms] group-data-[open]:[&_svg]:rotate-180"
            variant="text"
            tone="secondary"
            size="small"
            disabled={disabled}
            icon={<ChevronDown />}
            aria-label={expanded ? "Close calendar" : "Open calendar"}
            aria-expanded={expanded}
            onClick={toggle}
          />
        )}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
      />
      <div
        ref={panelRef}
        id={contentId}
        role="dialog"
        aria-label={ariaLabel ?? "Choose date"}
        aria-hidden={!expanded}
        {...(!expanded ? { inert: true } : {})}
        className="absolute left-0 top-full z-[120] max-w-full transition-[height,opacity] motion-reduce:!duration-0"
        style={{
          width: calendarWidth === "full" ? "100%" : calendarWidth === "three-quarter" ? "75%" : Number.isFinite(calendarWidth) ? `${Math.max(1, calendarWidth)}px` : "100%",
          height: expanded ? contentHeight * Math.min(panelWidth / 320, 1) : 0,
          opacity: expanded ? 1 : 0,
          transitionDuration: `${motionTokens.duration.expand}s`,
          transitionTimingFunction: `cubic-bezier(${motionTokens.ease.enter.join(", ")})`,
        }}
      >
        {narrower && <span aria-hidden="true" className="pointer-events-none absolute left-full top-0 h-[18px] w-[18px]" style={{ background: `radial-gradient(circle at 100% 100%, transparent 18px, ${surface} 18.5px)` }} />}
        <div className="h-full overflow-hidden rounded-b-[var(--radius-surface)]" style={{ background: surface }}>
          <div ref={contentRef} style={{ width: `${100 / Math.min(Math.max(panelWidth / 320, 0.01), 1)}%`, transform: `scale(${Math.min(Math.max(panelWidth / 320, 0.01), 1)})`, transformOrigin: "top left" }}>
            {typeof children === "function" ? children({ close }) : children}
          </div>
        </div>
      </div>
    </div>
  );
}
