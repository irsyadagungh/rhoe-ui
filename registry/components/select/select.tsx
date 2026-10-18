"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "../button/button";
import { Input, type InputProps } from "../input/input";
import { motionTokens } from "../lib/motion-tokens";
import { TextReveal } from "../text-reveal/text-reveal";
import "../foundation.css";

export type SelectValue = string | string[];

export interface SelectItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  /** Content shown before the item label, such as an icon or avatar. */
  leading?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  InputProps,
  "type" | "value" | "defaultValue" | "onValueChange" | "prefixIcon" | "suffixIcon" | "suffixControl" | "valueDisplay" | "valueDisplayInteractive" | "onValueDisplayClick" | "expanded" | "expandedContent" | "clearable"
> {
  /** Available choices. */
  items: SelectItem[];
  /** Allows selecting more than one item. */
  multiple?: boolean;
  /** Controlled selected value or values. */
  value?: SelectValue;
  /** Initial uncontrolled selected value or values. */
  defaultValue?: SelectValue;
  /** Receives the next selected value or values. */
  onValueChange?: (value: SelectValue) => void;
  /** Shows a searchable field above the choices. */
  searchable?: boolean;
  /** Placeholder for the optional search field. */
  searchPlaceholder?: string;
  /** Content displayed when no item matches the search. */
  emptyState?: ReactNode;
  /** Accessible name for the choices. */
  listLabel?: string;
  /** Called when the dropdown opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

function toValues(value: SelectValue | undefined, multiple: boolean) {
  if (Array.isArray(value)) return multiple ? value : value.slice(0, 1);
  return value ? [value] : [];
}

export function Select({
  items,
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  searchable = false,
  searchPlaceholder = "Search options",
  emptyState = "No options found.",
  listLabel = "Select options",
  onOpenChange,
  disabled,
  placeholder = "Select an option",
  onClick,
  onKeyDown,
  ...inputProps
}: SelectProps) {
  const [internalValue, setInternalValue] = useState<SelectValue>(defaultValue ?? (multiple ? [] : ""));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hoverTarget = useRef<HTMLButtonElement | null>(null);
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const hoverWidth = useMotionValue(0);
  const hoverHeight = useMotionValue(0);
  const hoverOpacity = useMotionValue(0);
  const reduceMotion = useReducedMotion() ?? false;
  const listId = `${useId()}-options`;
  const currentValue = value !== undefined ? value : internalValue;
  const selectedValues = toValues(currentValue, multiple);
  const selectedItems = useMemo(
    () => selectedValues.map((selectedValue) => items.find((item) => item.value === selectedValue)).filter(Boolean) as SelectItem[],
    [items, selectedValues],
  );
  const selectedLabels = selectedItems.map((item) => typeof item.label === "string" ? item.label : item.value);
  const displayValue = multiple
    ? selectedItems.length ? `${selectedItems.length} selected` : ""
    : selectedLabels[0] ?? "";
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => {
      const label = typeof item.label === "string" ? item.label : item.value;
      return item.value.toLocaleLowerCase().includes(normalizedQuery)
        || label.toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [items, query]);

  const setExpanded = useCallback((nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [disabled, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      (searchable ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
    });
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [open, searchable, setExpanded]);

  const selectItem = (item: SelectItem) => {
    if (item.disabled) return;
    const selected = selectedValues.includes(item.value);
    const nextValues = multiple
      ? selected
        ? selectedValues.filter((selectedValue) => selectedValue !== item.value)
        : [...selectedValues, item.value]
      : [item.value];
    const nextValue: SelectValue = multiple ? nextValues : nextValues[0] ?? "";
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    if (!multiple) {
      setExpanded(false);
      setQuery("");
    }
  };

  const removeItem = (itemValue: string) => {
    if (!multiple) return;
    const nextValues = selectedValues.filter((selectedValue) => selectedValue !== itemValue);
    if (value === undefined) setInternalValue(nextValues);
    onValueChange?.(nextValues);
  };

  const moveOptionHover = (item: HTMLButtonElement) => {
    if (hoverTarget.current === item) return;
    const list = listRef.current;
    if (!list) return;

    const listBounds = list.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    const target = {
      x: itemBounds.left - listBounds.left + list.scrollLeft,
      y: itemBounds.top - listBounds.top + list.scrollTop,
      width: itemBounds.width,
      height: itemBounds.height,
    };

    if (!hoverTarget.current || reduceMotion) {
      hoverX.jump(target.x);
      hoverY.jump(target.y);
      hoverWidth.jump(target.width);
      hoverHeight.jump(target.height);
    } else {
      animate(hoverX, target.x, motionTokens.spring.smooth);
      animate(hoverY, target.y, motionTokens.spring.smooth);
      animate(hoverWidth, target.width, motionTokens.spring.smooth);
      animate(hoverHeight, target.height, motionTokens.spring.smooth);
    }

    hoverTarget.current = item;
    hoverOpacity.set(1);
  };

  const hideOptionHover = () => {
    hoverTarget.current = null;
    animate(hoverOpacity, 0, reduceMotion
      ? { duration: 0 }
      : { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard });
  };

  const selectedValueDisplay = multiple && selectedItems.length ? (
    <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden pr-1">
      {selectedItems.map((item) => (
        <span key={item.value} className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[var(--surface-muted)] py-0.5 pr-1 pl-2 text-xs leading-none font-[620] text-[var(--text)]">
          <span className="max-w-28 overflow-hidden text-ellipsis whitespace-nowrap">
            {typeof item.label === "string" ? (
              <TextReveal key={item.value} by="word">{item.label}</TextReveal>
            ) : item.label}
          </span>
          <button
            type="button"
            className="grid size-4 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            aria-label={`Remove ${typeof item.label === "string" ? item.label : item.value}`}
            onClick={(event) => {
              event.stopPropagation();
              removeItem(item.value);
            }}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </span>
  ) : selectedItems[0] ? (
    <TextReveal key={selectedItems[0].value} by="word">
      {selectedLabels[0]}
    </TextReveal>
  ) : displayValue;

  const close = () => {
    setExpanded(false);
    setQuery("");
  };

  return (
    <div
      ref={rootRef}
      className="group relative z-0 w-full data-[open]:z-[120]"
      data-open={open || undefined}
      style={{ "--input-expanded-height": searchable ? "300px" : "260px" } as CSSProperties}
    >
      <Input
        {...inputProps}
        type="text"
        value={displayValue}
        valueDisplay={selectedValueDisplay}
        valueDisplayInteractive={multiple && selectedItems.length > 0}
        onValueDisplayClick={() => setExpanded(true)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        clearable={false}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        suffixControl={(
          <Button
            className="min-h-[34px] w-[34px] p-0 [&_svg]:size-4 [&_svg]:transition-[rotate] [&_svg]:duration-[220ms] [&_svg]:ease-[var(--ease-standard)] motion-reduce:[&_svg]:duration-[0.01ms] group-data-[open]:[&_svg]:rotate-180"
            variant="text"
            tone="secondary"
            size="small"
            disabled={disabled}
            aria-label={open ? "Close select" : "Open select"}
            aria-expanded={open}
            aria-controls={listId}
            icon={<ChevronDown />}
            onClick={() => setExpanded(!open)}
          />
        )}
        expanded={open}
        expandedContent={(
          <div
            className={`grid h-full min-h-0 ${searchable ? "grid-rows-[auto_minmax(0,1fr)] gap-2.5 p-2.5 pb-3" : "p-2.5"}`}
            {...(!open ? { inert: true } : {})}
          >
            {searchable ? (
              <Input
                ref={searchRef}
                className="[&_input]:text-[13px]"
                size="small"
                variant="bordered"
                aria-label="Search options"
                placeholder={searchPlaceholder}
                prefixIcon={<Search />}
                value={query}
                onValueChange={setQuery}
                onKeyDown={(event) => {
                  if (event.key === "Escape") close();
                }}
              />
            ) : null}
            <ul
              ref={listRef}
              id={listId}
              className="relative m-0 grid min-h-0 content-start gap-0.5 overflow-y-auto overscroll-contain p-0 [scrollbar-width:thin] focus:outline-none"
              role="listbox"
              tabIndex={-1}
              aria-label={listLabel}
              aria-multiselectable={multiple || undefined}
              onPointerMove={(event) => {
                const item = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-select-option]");
                if (item) moveOptionHover(item);
              }}
              onPointerLeave={hideOptionHover}
            >
              <motion.span
                className="pointer-events-none absolute z-[2] rounded-[var(--radius-surface)] bg-[color-mix(in_srgb,var(--surface-muted)_24%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
                style={{ x: hoverX, y: hoverY, width: hoverWidth, height: hoverHeight, opacity: hoverOpacity }}
                aria-hidden="true"
              />
              {filteredItems.length ? filteredItems.map((item) => {
                const selected = selectedValues.includes(item.value);
                return (
                  <li key={item.value} role="none">
                    <Button
                      className={[
                        "relative z-[3] grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] justify-stretch gap-3 px-3 text-left hover:!bg-transparent",
                        item.leading && "grid-cols-[auto_minmax(0,1fr)_auto]",
                        "[&>svg]:size-4",
                      ].filter(Boolean).join(" ")}
                      variant="text"
                      tone="secondary"
                      size="small"
                      role="option"
                      data-select-option
                      aria-selected={selected}
                      disabled={item.disabled}
                      onClick={() => selectItem(item)}
                    >
                      {item.leading ? <span className="grid shrink-0 place-items-center text-[var(--text-secondary)] [&>svg]:size-[18px]">{item.leading}</span> : null}
                      <span className="min-w-0">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-[620] text-[var(--text)]">{item.label}</span>
                        {item.description ? <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--text-secondary)]">{item.description}</span> : null}
                      </span>
                      {selected ? <Check className="text-[var(--success-surface-foreground)]" aria-hidden="true" /> : null}
                    </Button>
                  </li>
                );
              }) : (
                <li className="grid min-h-full place-items-center p-5 text-center text-[13px] text-[var(--text-secondary)]" role="status">{emptyState}</li>
              )}
            </ul>
          </div>
        )}
        onClick={(event) => {
          setExpanded(true);
          onClick?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
          onKeyDown?.(event);
        }}
      />
    </div>
  );
}
