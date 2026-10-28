"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
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
  children,
}: DateFieldPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(432);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={rootRef}
      className={["group relative z-0 w-full data-[open]:z-[120]", className].filter(Boolean).join(" ")}
      data-open={expanded || undefined}
      style={{
        "--input-expanded-height": `${contentHeight}px`,
        "--input-expanded-duration": `${motionTokens.duration.expand}s`,
        "--input-expanded-ease": `cubic-bezier(${motionTokens.ease.enter.join(", ")})`,
      } as CSSProperties}
    >
      {label && typeof label !== "string" ? (
        <span id={labelId} className="mb-2 block text-[13px] font-[620] leading-[1.4] text-[var(--text)]">{label}</span>
      ) : null}
      <Input
        ref={inputRef}
        className="[&_input]:cursor-pointer"
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
        expanded={expanded}
        expandedContent={(
          <div
            ref={contentRef}
            id={contentId}
            role="dialog"
            aria-label={ariaLabel ?? "Choose date"}
            {...(!expanded ? { inert: true } : {})}
          >
            {typeof children === "function" ? children({ close }) : children}
          </div>
        )}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
      />
    </div>
  );
}
