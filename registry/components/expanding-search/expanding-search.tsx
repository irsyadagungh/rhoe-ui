"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  Fragment,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import {
  AnimatedList,
  AnimatedListItem,
  type AnimatedListItemProps,
  type AnimatedListItemVariant,
  type AnimatedListProps,
} from "../animated-list/animated-list";
import { Button } from "../button/button";
import { Input, type InputProps } from "../input/input";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type ExpandingSearchTrigger = "icon" | "icon-text" | "field";
export type ExpandingSearchAnchor = "start" | "center" | "end" | number;
export type ExpandingSearchPanelSize = "small" | "medium" | "large" | "xl";

export interface ExpandingSearchItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  keywords?: string[];
  /** Optional result section label. Generated results with the same label stay together. */
  group?: string;
  disabled?: boolean;
}

export interface ExpandingSearchChildrenContext {
  query: string;
  close: () => void;
}

/** Options forwarded to the generated AnimatedList result wrapper. */
export type ExpandingSearchAnimatedListProps = Omit<
  AnimatedListProps<ExpandingSearchItem>,
  "children" | "items" | "renderItem" | "getItemKey" | "id" | "className" | "aria-label"
>;

/** Options forwarded to each generated AnimatedListItem result row. */
export type ExpandingSearchItemProps = Pick<
  AnimatedListItemProps,
  "variant" | "descriptionPlacement" | "trailing" | "href" | "swipeActions"
>;

export type ExpandingSearchItemPropsResolver = (
  item: ExpandingSearchItem,
  context: { query: string; select: () => void },
) => ExpandingSearchItemProps;

export interface ExpandingSearchProps extends Omit<
  InputProps,
  "children" | "label" | "hint" | "error" | "prefixIcon" | "suffixIcon" | "suffixControl" | "value" | "defaultValue" | "onValueChange" | "type" | "expanded" | "expandedContent"
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ExpandingSearchTrigger;
  triggerLabel?: ReactNode;
  triggerAriaLabel?: string;
  anchor?: ExpandingSearchAnchor;
  panelSize?: ExpandingSearchPanelSize;
  /** Dims and lightly blurs the page behind an open search surface. */
  backdrop?: boolean;
  expandedWidth?: number;
  fieldWidth?: number;
  items?: ExpandingSearchItem[];
  defaultItems?: ExpandingSearchItem[];
  /** Direct result content. It takes precedence over items and stays animated by AnimatedList. */
  children?: ReactNode | ((context: ExpandingSearchChildrenContext) => ReactNode);
  /** Uses Animated List for result entry motion and hover treatment. */
  animatedList?: boolean;
  /** Options forwarded to AnimatedList while animatedList is enabled. */
  animatedListProps?: ExpandingSearchAnimatedListProps;
  /** Reduces padding and gaps between generated or custom result rows. */
  listDense?: boolean;
  /** Visual treatment for generated items when items or defaultItems are used. */
  itemVariant?: AnimatedListItemVariant;
  /** Item options, or a resolver for item-specific options such as inline metadata and swipe actions. */
  itemProps?: ExpandingSearchItemProps | ExpandingSearchItemPropsResolver;
  emptyState?: ReactNode;
  resultsLabel?: string;
  filterItems?: (items: ExpandingSearchItem[], query: string) => ExpandingSearchItem[];
  renderItem?: (item: ExpandingSearchItem, context: { query: string; select: () => void }) => ReactNode;
  onItemSelect?: (item: ExpandingSearchItem) => void;
}

function resolveAnchor(anchor: ExpandingSearchAnchor) {
  if (anchor === "start") return { position: "0%", shift: "0%" };
  if (anchor === "end") return { position: "100%", shift: "-100%" };
  const percentage = typeof anchor === "number" ? Math.min(100, Math.max(0, anchor)) : 50;
  return { position: `${percentage}%`, shift: `-${percentage}%` };
}

function defaultSearch(items: ExpandingSearchItem[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const label = typeof item.label === "string" ? item.label : "";
    return [item.value, label, ...(item.keywords ?? [])]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
}

function subscribeToPortal() {
  return () => {};
}

export function ExpandingSearch({
  value,
  defaultValue = "",
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  trigger = "icon",
  triggerLabel = "Search",
  triggerAriaLabel = "Open search",
  anchor = "center",
  panelSize = "medium",
  backdrop = false,
  expandedWidth,
  fieldWidth = 360,
  items,
  defaultItems,
  children,
  animatedList = true,
  animatedListProps,
  listDense = true,
  itemVariant = "transparent",
  itemProps,
  emptyState = "No results yet.",
  resultsLabel = "Search results",
  filterItems = defaultSearch,
  renderItem,
  onItemSelect,
  variant = "filled",
  disabled,
  placeholder = "Search",
  onKeyDown,
  className,
  ...inputProps
}: ExpandingSearchProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [searchContentVisible, setSearchContentVisible] = useState(defaultOpen);
  const [measuredClosedWidth, setMeasuredClosedWidth] = useState(52);
  const [portalPosition, setPortalPosition] = useState<{ left: number; top: number } | null>(null);
  const portalContainer = useSyncExternalStore(
    subscribeToPortal,
    () => document.body,
    () => null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const resultPanelRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const expandedRef = useRef(false);
  const resultsId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const query = value ?? internalValue;
  const expanded = open ?? internalOpen;
  const sourceItems = useMemo(() => items ?? defaultItems ?? [], [defaultItems, items]);
  const results = useMemo(
    () => filterItems(sourceItems, query),
    [filterItems, query, sourceItems],
  );

  useLayoutEffect(() => {
    const list = resultPanelRef.current?.querySelector<HTMLElement>("[data-expanding-search-results]");
    if (!list) return;
    list.scrollTop = 0;
    list.scrollLeft = 0;
  }, [query, results.length]);
  const hasCustomContent = children !== undefined;
  const resultGroups = useMemo(() => {
    const groups = new Map<string, ExpandingSearchItem[]>();

    for (const item of results) {
      const label = item.group ?? "";
      const groupItems = groups.get(label) ?? [];
      groupItems.push(item);
      groups.set(label, groupItems);
    }

    return Array.from(groups, ([label, items]) => ({ label, items }));
  }, [results]);
  const hasResultGroups = resultGroups.some((group) => group.label);
  const anchorStyle = resolveAnchor(anchor);
  const closedWidth = trigger === "field" ? fieldWidth : measuredClosedWidth;
  const defaultExpandedWidth = panelSize === "small"
    ? 360
    : panelSize === "large"
      ? 600
      : panelSize === "xl"
        ? 720
        : 480;
  const openWidth = Math.max(expandedWidth ?? defaultExpandedWidth, closedWidth);
  const surfaceWidth = useMotionValue(closedWidth);
  const shouldPortalSurface = backdrop && Boolean(portalContainer) && Boolean(portalPosition);

  const updatePortalPosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const anchorRatio = Number.parseFloat(anchorStyle.position) / 100;
    setPortalPosition({ left: rect.left + rect.width * anchorRatio, top: rect.top });
  }, [anchorStyle.position]);

  const setExpanded = useCallback((nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange, open]);

  const openSearch = useCallback(() => {
    updatePortalPosition();
    setSearchContentVisible(true);
    setExpanded(true);
  }, [setExpanded, updatePortalPosition]);

  useEffect(() => {
    if (!expanded || searchContentVisible) return;
    const frame = requestAnimationFrame(() => setSearchContentVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [expanded, searchContentVisible]);

  useLayoutEffect(() => {
    expandedRef.current = expanded;
    const targetWidth = expanded ? openWidth : closedWidth;

    if (reduceMotion) {
      surfaceWidth.jump(targetWidth);
      if (!expanded) {
        const frame = requestAnimationFrame(() => {
          if (!expandedRef.current) setSearchContentVisible(false);
        });
        return () => cancelAnimationFrame(frame);
      }
      return;
    }

    const control = animate(
      surfaceWidth,
      targetWidth,
      expanded ? motionTokens.spring.morph : motionTokens.spring.smooth,
    );

    if (!expanded) {
      void control.then(() => {
        if (!expandedRef.current) setSearchContentVisible(false);
      });
    }

    return () => control.stop();
  }, [closedWidth, expanded, openWidth, reduceMotion, surfaceWidth]);

  useLayoutEffect(() => {
    if (trigger === "field") return;

    const sizer = sizerRef.current;
    if (!sizer) return;
    const observer = new ResizeObserver(() => {
      setMeasuredClosedWidth(Math.ceil(sizer.offsetWidth));
    });
    observer.observe(sizer);
    return () => observer.disconnect();
  }, [trigger, triggerLabel]);

  useEffect(() => {
    if (!expanded || !searchContentVisible) return;
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));

    const handleOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !surfaceRef.current?.contains(target)) setExpanded(false);
    };
    document.addEventListener("pointerdown", handleOutsidePress);
    return () => document.removeEventListener("pointerdown", handleOutsidePress);
  }, [expanded, searchContentVisible, setExpanded]);

  useLayoutEffect(() => {
    if (!shouldPortalSurface) return;

    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [expanded, searchContentVisible, shouldPortalSurface, updatePortalPosition]);

  const setQuery = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const selectItem = (item: ExpandingSearchItem) => {
    if (item.disabled) return;
    onItemSelect?.(item);
    setExpanded(false);
  };
  const customContent = typeof children === "function"
    ? children({ query, close: () => setExpanded(false) })
    : children;
  const getGeneratedItemProps = (item: ExpandingSearchItem) => {
    const context = { query, select: () => selectItem(item) };
    const resolved = typeof itemProps === "function" ? itemProps(item, context) : itemProps;
    return { variant: itemVariant, ...resolved };
  };

  const renderGeneratedItem = (item: ExpandingSearchItem) => {
    const resolvedItemProps = getGeneratedItemProps(item);

    return (
      <AnimatedListItem
        className="w-full rounded-xl"
        {...resolvedItemProps}
        leading={item.icon ? <span className="grid shrink-0 place-items-center text-[var(--text-secondary)] [&>svg]:size-[17px]" aria-hidden="true">{item.icon}</span> : undefined}
        title={item.label}
        description={item.description}
        disabled={item.disabled}
        onClick={() => selectItem(item)}
      />
    );
  };
  const renderResult = (item: ExpandingSearchItem) => renderItem ? (
    <span className="block">
      {renderItem(item, { query, select: () => selectItem(item) })}
    </span>
  ) : renderGeneratedItem(item);
  const renderResults = (staticList = false) => {
    if (!hasResultGroups) return results.map((item) => (
      staticList
        ? <li key={item.value} className="w-full min-w-0">{renderResult(item)}</li>
        : <Fragment key={item.value}>{renderResult(item)}</Fragment>
    ));

    return resultGroups.flatMap((group) => {
      const rows = group.items.map((item) => (
        staticList
          ? <li key={item.value} className="w-full min-w-0">{renderResult(item)}</li>
          : <Fragment key={item.value}>{renderResult(item)}</Fragment>
      ));
      if (!group.label) return rows;

      const heading = staticList ? (
        <li key={`${group.label}-heading`} className="min-w-0 list-none">
          <p className="mx-2.5 mt-1 mb-0.5 text-[11px] leading-[1.3] font-[750] tracking-[0.08em] uppercase text-[var(--text-secondary)]">{group.label}</p>
        </li>
      ) : (
        <div key={`${group.label}-heading`} className="min-w-0">
          <p className="mx-2.5 mt-1 mb-0.5 text-[11px] leading-[1.3] font-[750] tracking-[0.08em] uppercase text-[var(--text-secondary)]">{group.label}</p>
        </div>
      );

      return [heading, ...rows];
    });
  };

  const rootStyle = {
    "--expanding-search-closed-width": `${closedWidth}px`,
    "--expanding-search-anchor-position": anchorStyle.position,
    "--expanding-search-anchor-shift": anchorStyle.shift,
  } as CSSProperties;

  const isIconOnly = trigger === "icon";
  const inputSize = inputProps.dense ? "small" : inputProps.size ?? "medium";
  const controlHeightClass = {
    small: "min-h-10",
    medium: "min-h-[46px]",
    large: "min-h-[52px]",
  }[inputSize];
  const controlRootHeightClass = {
    small: "h-10",
    medium: "h-[46px]",
    large: "h-[52px]",
  }[inputSize];
  const iconWidthClass = {
    small: "w-10",
    medium: "w-[46px]",
    large: "w-[52px]",
  }[inputSize];
  const triggerContent = <><Search aria-hidden="true" />{trigger !== "icon" ? <span>{triggerLabel}</span> : null}</>;
  const resultSurfaceClass = variant === "filled"
    ? "border-transparent bg-[var(--surface-muted)]"
    : "border-[var(--border)] bg-[var(--surface)]";
  const searchTrigger = () => isIconOnly ? (
    <Button
      ref={triggerRef}
      className={["w-full justify-center rounded-[18px] !border-transparent !bg-transparent p-0 hover:!bg-transparent", controlHeightClass].join(" ")}
      variant={variant}
      tone="secondary"
      size={inputSize}
      icon={<Search />}
      aria-label={triggerAriaLabel}
      aria-expanded={false}
      aria-controls={resultsId}
      aria-hidden={expanded || undefined}
      tabIndex={expanded ? -1 : undefined}
      disabled={disabled}
      onClick={openSearch}
    />
  ) : (
    <Button
      ref={triggerRef}
      className={["w-full justify-start rounded-[18px] !border-transparent !bg-transparent !px-3.5 !text-[14px] !leading-[1.5] !font-normal !tracking-[-0.01em] hover:!bg-transparent", controlHeightClass].join(" ")}
      variant={variant}
      tone="secondary"
      size={inputSize}
      icon={<Search />}
      aria-expanded={false}
      aria-controls={resultsId}
      aria-hidden={expanded || undefined}
      tabIndex={expanded ? -1 : undefined}
      disabled={disabled}
      onClick={openSearch}
    >
      {triggerLabel}
    </Button>
  );

  const surface = (
      <motion.div
        ref={surfaceRef}
        className={[
          "absolute z-[1] top-0 left-[var(--expanding-search-anchor-position)] w-[var(--expanding-search-closed-width)] max-w-[calc(100vw-32px)] translate-x-[var(--expanding-search-anchor-shift)] origin-top rounded-[18px] border text-[var(--text)] transition-[background-color,border-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] will-change-[width] motion-reduce:duration-[0.01ms]",
          variant === "filled"
            ? "border-transparent bg-[var(--surface-muted)]"
            : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_58%,var(--surface))]",
          expanded && "border-[var(--focus)]",
          disabled && "opacity-[0.52]",
          shouldPortalSurface && "fixed z-[111]",
        ].filter(Boolean).join(" ")}
        data-open={expanded || undefined}
        style={{
          width: surfaceWidth,
          ...(shouldPortalSurface && portalPosition ? {
            ...rootStyle,
            left: `${portalPosition.left}px`,
            top: `${portalPosition.top}px`,
          } : {}),
        }}
      >
        <>
            <motion.div
              className="relative z-[1] w-full"
              inert={trigger !== "field" && !expanded}
              aria-hidden={trigger !== "field" && !expanded}
              initial={false}
              animate={trigger === "field" || expanded
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0, filter: reduceMotion ? "blur(0px)" : `blur(${motionTokens.blur.subtle}px)` }}
              transition={reduceMotion
                ? { duration: 0.1 }
                : expanded
                  ? { duration: 0.18, delay: 0.08, ease: motionTokens.ease.enter }
                  : { duration: 0.08 }}
            >
              <Input
              {...inputProps}
              ref={inputRef}
              className="w-full [&>div>div]:!border-transparent [&>div>div]:!bg-transparent"
              variant={variant}
              disabled={disabled}
              type="search"
              value={query}
              placeholder={placeholder}
              prefixIcon={<Search />}
              tabIndex={expanded || trigger === "field" ? (inputProps.tabIndex ?? 0) : -1}
              aria-expanded={expanded}
              aria-controls={resultsId}
              onFocus={(event) => {
                if (!expanded) openSearch();
                inputProps.onFocus?.(event);
              }}
              onClick={(event) => {
                if (!expanded) openSearch();
                inputProps.onClick?.(event);
              }}
              onValueChange={(nextValue) => {
                if (!expanded) openSearch();
                setQuery(nextValue);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setExpanded(false);
                  requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
                }
                onKeyDown?.(event);
              }}
            />
            </motion.div>
            {trigger !== "field" ? (
              <motion.div
                className="absolute top-0 left-[var(--expanding-search-anchor-position)] z-[2] w-[var(--expanding-search-closed-width)] translate-x-[var(--expanding-search-anchor-shift)]"
                inert={expanded}
                initial={false}
                animate={expanded
                  ? {
                      opacity: 0,
                      scale: reduceMotion ? 1 : 0.88,
                      filter: reduceMotion ? "blur(0px)" : `blur(${motionTokens.blur.subtle}px)`,
                    }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={reduceMotion
                  ? { duration: 0.1 }
                  : expanded
                    ? { duration: 0.1 }
                    : { duration: 0.18, delay: 0.08, ease: motionTokens.ease.enter }}
              >
                {searchTrigger()}
              </motion.div>
            ) : null}
            {searchContentVisible ? <motion.div
              ref={resultPanelRef}
              className="absolute z-[1] top-[calc(100%+10px)] w-full min-w-0"
              initial={false}
              animate={{
                opacity: expanded ? 1 : 0,
                transform: expanded || reduceMotion
                  ? "translateY(0) scale(1)"
                  : "translateY(-3px) scale(0.985)",
              }}
              transition={reduceMotion
                ? { duration: 0.1 }
                : expanded
                  ? { duration: 0.2, delay: 0.1, ease: motionTokens.ease.enter }
                  : { duration: 0.08 }}
              style={{ transformOrigin: `${anchorStyle.position} top` }}
              aria-hidden={!expanded}
            >
            {animatedList ? (
              <AnimatedList
                id={resultsId}
                data-expanding-search-results=""
                className={[
                  "m-0 grid max-h-[300px] w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[18px] border p-1.5 list-none shadow-[var(--shadow-resting)] [&>li]:w-full [&>li]:min-w-0",
                  resultSurfaceClass,
                  expanded ? "pointer-events-auto" : "pointer-events-none",
                ].filter(Boolean).join(" ")}
                aria-label={resultsLabel}
                aria-hidden={!expanded}
                {...animatedListProps}
                amount={animatedListProps?.amount ?? 0.1}
                stagger={animatedListProps?.stagger ?? 0.04}
                dense={animatedListProps?.dense ?? listDense}
              >
                {hasCustomContent ? customContent : results.length ? renderResults() : <span className="grid min-h-[104px] place-items-center p-5 text-center text-[13px] text-[var(--text-secondary)]" role="status">{emptyState}</span>}
              </AnimatedList>
            ) : (
              <ul
                id={resultsId}
                data-expanding-search-results=""
                className={[
                  "m-0 grid max-h-[300px] w-full min-w-0 gap-1.5 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[18px] border p-1.5 list-none shadow-[var(--shadow-resting)] [&>li]:w-full [&>li]:min-w-0",
                  resultSurfaceClass,
                  expanded ? "pointer-events-auto" : "pointer-events-none",
                ].filter(Boolean).join(" ")}
                aria-label={resultsLabel}
                aria-hidden={!expanded}
                data-dense={listDense || undefined}
              >
                {hasCustomContent ? customContent : results.length ? renderResults(true) : <li className="grid min-h-[104px] place-items-center p-5 text-center text-[13px] text-[var(--text-secondary)]" role="status">{emptyState}</li>}
              </ul>
            )}
            </motion.div> : null}
          </>
      </motion.div>
  );

  return (
    <div
      ref={rootRef}
      className={[
        "relative z-0 inline-block w-[var(--expanding-search-closed-width)] max-w-full data-[active]:z-[120]",
        controlRootHeightClass,
        className,
      ].filter(Boolean).join(" ")}
      data-open={expanded || undefined}
      data-active={searchContentVisible || undefined}
      style={rootStyle}
    >
      <span ref={sizerRef} className={[
        "pointer-events-none absolute inline-flex box-border items-center gap-2 px-3.5 text-[14px] leading-[1.5] font-normal tracking-[-0.01em] invisible whitespace-nowrap [&>svg]:size-[18px]",
        controlHeightClass,
        trigger === "icon" && iconWidthClass,
        trigger === "icon" && "justify-center p-0",
        trigger === "field" && "w-full px-[18px]",
      ].filter(Boolean).join(" ")} aria-hidden="true">
        {triggerContent}
      </span>
      {backdrop && searchContentVisible && portalContainer ? createPortal(
        <button
          className={["pointer-events-none fixed inset-0 z-[110] border-0 bg-black/35 p-0 opacity-0 backdrop-blur-none transition-[opacity,backdrop-filter] duration-[220ms] ease-[var(--ease-standard)] motion-reduce:duration-[0.01ms]", expanded && "pointer-events-auto opacity-100 backdrop-blur-sm"].filter(Boolean).join(" ")}
          type="button"
          tabIndex={-1}
          aria-label="Close search"
          onClick={() => setExpanded(false)}
        />,
        portalContainer,
      ) : null}
      {shouldPortalSurface && portalContainer ? createPortal(surface, portalContainer) : surface}
    </div>
  );
}
