"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Checkbox } from "../checkbox/checkbox";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type TableHeaderVariant = "docked" | "floating";
export type TableSortDirection = "ascending" | "descending";

export interface TableSort {
  key: string;
  direction: TableSortDirection;
}

export interface TableColumn<Row> {
  /** Stable identifier used for sorting and React keys. */
  key: string;
  /** Visible column heading. */
  header: ReactNode;
  /** Renders the value for one row. */
  cell: (row: Row) => ReactNode;
  /** Enables sorting and returns the comparable value. */
  sortValue?: (row: Row) => string | number;
  /** Horizontal alignment shared by the heading and cells. */
  align?: "start" | "center" | "end";
  /** Optional CSS width for the column. */
  width?: CSSProperties["width"];
}

export interface TableProps<Row> {
  /** Rows displayed in the table. */
  data: readonly Row[];
  /** Column definitions used to render and optionally sort the data. */
  columns: readonly TableColumn<Row>[];
  /** Returns a stable identifier for each row. */
  getRowId: (row: Row) => string;
  /** Docked uses a muted header. Floating uses a surface header with a small gap before the first row. */
  headerVariant?: TableHeaderVariant;
  /** Shows sequential row positions in the current display order. */
  showRowNumbers?: boolean;
  /** Enables row selection. */
  selectable?: boolean;
  /** Shows the dedicated checkbox column when selection is enabled without row numbers. */
  editMode?: boolean;
  /** Controlled selected row identifiers. */
  selectedRows?: readonly string[];
  /** Initial selected row identifiers. */
  defaultSelectedRows?: readonly string[];
  /** Receives the next selected row identifiers. */
  onSelectionChange?: (rowIds: string[]) => void;
  /** Controlled sort state. */
  sort?: TableSort;
  /** Initial sort state. */
  defaultSort?: TableSort;
  /** Receives the next sort state. */
  onSortChange?: (sort: TableSort) => void;
  /**
   * Animates row reordering. Defaults to true for up to 100 rows,
   * because layout animation gets heavy on large datasets.
   */
  animateLayout?: boolean;
  /** Accessible name for the table. */
  ariaLabel?: string;
  /** Content displayed when data is empty. */
  emptyState?: ReactNode;
  /** Additional classes for the root. */
  className?: string;
}

const LAYOUT_ANIMATION_LIMIT = 100;

const alignment = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
} as const;

function compareValues(left: string | number, right: string | number) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function SelectionColumnContent({ open, children }: { open: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  // Set through the DOM property so it behaves the same on React 18 and 19.
  useEffect(() => {
    if (ref.current) ref.current.inert = !open;
  }, [open]);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ width: open ? "3.5rem" : "0rem", opacity: open ? 1 : 0 }}
      transition={reduceMotion ? { duration: 0 } : {
        duration: motionTokens.duration.standard,
        ease: motionTokens.ease.standard,
      }}
      className="overflow-hidden"
      aria-hidden={!open}
    >
      <div className="flex w-14 items-center justify-center py-1">{children}</div>
    </motion.div>
  );
}

export function Table<Row>({
  data,
  columns,
  getRowId,
  headerVariant = "docked",
  showRowNumbers = true,
  selectable = false,
  editMode = false,
  selectedRows,
  defaultSelectedRows = [],
  onSelectionChange,
  sort,
  defaultSort,
  onSortChange,
  animateLayout,
  ariaLabel = "Data table",
  emptyState = "No data available.",
  className,
}: TableProps<Row>) {
  const reduceMotion = useReducedMotion() ?? false;
  const contentRef = useRef<HTMLDivElement>(null);
  const activeHoverRow = useRef<HTMLElement | null>(null);
  const hoverY = useMotionValue(0);
  const hoverHeight = useMotionValue(0);
  const hoverOpacity = useMotionValue(0);
  const [internalSelectedRows, setInternalSelectedRows] = useState(defaultSelectedRows);
  const [internalSort, setInternalSort] = useState<TableSort | undefined>(defaultSort);
  const currentSelectedRows = selectedRows ?? internalSelectedRows;
  const currentSort = sort ?? internalSort;
  const selectedSet = useMemo(() => new Set(currentSelectedRows), [currentSelectedRows]);
  const showCheckboxColumn = selectable && !showRowNumbers && editMode;
  // Keep a zero-width selection slot mounted so opening and closing can both animate.
  const hasLeadingColumn = showRowNumbers || selectable;
  const hasVisibleLeadingColumn = showRowNumbers || showCheckboxColumn;
  const columnCount = columns.length + (hasLeadingColumn ? 1 : 0);
  const isFloating = headerVariant === "floating";
  const layoutAnimated = (animateLayout ?? data.length <= LAYOUT_ANIMATION_LIMIT) && !reduceMotion;

  const rows = useMemo(() => {
    const entries = data.map((row, originalIndex) => ({ row, originalIndex }));
    const column = currentSort
      ? columns.find((candidate) => candidate.key === currentSort.key)
      : undefined;
    const sortValue = column?.sortValue;
    if (!currentSort || !sortValue) return entries;

    // Compute each sort value once instead of inside the comparator.
    const keyed = entries.map((entry) => ({ ...entry, value: sortValue(entry.row) }));
    const factor = currentSort.direction === "ascending" ? 1 : -1;
    keyed.sort((left, right) =>
      factor * compareValues(left.value, right.value) || left.originalIndex - right.originalIndex);
    return keyed;
  }, [columns, currentSort, data]);

  // Rows move after a sort, so the old highlight position is stale. Hide it until the pointer moves again.
  const sortKey = currentSort?.key;
  const sortDirection = currentSort?.direction;
  useEffect(() => {
    activeHoverRow.current = null;
    hoverOpacity.set(0);
  }, [sortKey, sortDirection, hoverOpacity]);

  const updateSelection = (nextRows: string[]) => {
    if (selectedRows === undefined) setInternalSelectedRows(nextRows);
    onSelectionChange?.(nextRows);
  };

  const setRowSelected = (rowId: string, checked: boolean) => {
    updateSelection(checked
      ? [...new Set([...currentSelectedRows, rowId])]
      : currentSelectedRows.filter((selectedRow) => selectedRow !== rowId));
  };

  const allVisibleSelected = rows.length > 0
    && rows.every(({ row }) => selectedSet.has(getRowId(row)));

  const toggleAllRows = (checked: boolean) => {
    const visibleIds = rows.map(({ row }) => getRowId(row));
    if (checked) {
      updateSelection([...new Set([...currentSelectedRows, ...visibleIds])]);
      return;
    }
    const visibleSet = new Set(visibleIds);
    updateSelection(currentSelectedRows.filter((rowId) => !visibleSet.has(rowId)));
  };

  const updateSort = (column: TableColumn<Row>) => {
    if (!column.sortValue) return;
    const nextSort: TableSort = {
      key: column.key,
      direction: currentSort?.key === column.key && currentSort.direction === "ascending"
        ? "descending"
        : "ascending",
    };
    if (sort === undefined) setInternalSort(nextSort);
    onSortChange?.(nextSort);
  };

  const moveHover = (row: HTMLElement) => {
    if (activeHoverRow.current === row) return;
    const content = contentRef.current;
    if (!content) return;
    // The highlight lives inside the scrolling content, so both rects shift together
    // and no scrollTop or scrollLeft correction is needed.
    const y = row.getBoundingClientRect().top - content.getBoundingClientRect().top;
    const height = row.getBoundingClientRect().height;

    if (!activeHoverRow.current || reduceMotion) {
      hoverY.jump(y);
      hoverHeight.jump(height);
    } else {
      animate(hoverY, y, motionTokens.spring.smooth);
      animate(hoverHeight, height, motionTokens.spring.smooth);
    }
    activeHoverRow.current = row;
    hoverOpacity.set(1);
  };

  const hideHover = () => {
    activeHoverRow.current = null;
    animate(hoverOpacity, 0, reduceMotion
      ? { duration: 0 }
      : { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard });
  };

  const headerCell = [
    "border-b border-[var(--border)] text-[11px] font-[650] uppercase tracking-[0.04em] text-[var(--text-secondary)]",
    "bg-[var(--surface-muted)]",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={[
        "relative w-full overflow-auto rounded-[18px] bg-[var(--surface)] text-[var(--text)]",
        !isFloating && "border border-[var(--border)]",
        className,
      ].filter(Boolean).join(" ")}
      onPointerMove={(event) => {
        const row = (event.target as HTMLElement).closest<HTMLElement>("[data-table-row]");
        if (row) moveHover(row);
      }}
      onPointerLeave={hideHover}
    >
      <div ref={contentRef} className="relative w-full min-w-[640px]">
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-[color-mix(in_srgb,var(--surface-muted)_72%,transparent)]"
          style={{ y: hoverY, height: hoverHeight, opacity: hoverOpacity }}
          aria-hidden="true"
        />
        <table
          className="relative z-[1] w-full border-separate border-spacing-0 text-sm"
          aria-label={ariaLabel}
        >
          <thead className={isFloating ? "sticky top-2 z-[4]" : "sticky top-0 z-[4]"}>
            <tr>
              {hasLeadingColumn ? (
                <th
                  scope="col"
                  aria-hidden={!hasVisibleLeadingColumn || undefined}
                  className={[
                    headerCell,
                    "py-3 text-center",
                    showRowNumbers ? "w-14 px-4" : "w-0 px-0",
                    isFloating && "first:rounded-l-[14px]",
                  ].filter(Boolean).join(" ")}
                >
                  {!showRowNumbers ? (
                    <SelectionColumnContent open={showCheckboxColumn}>
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleAllRows}
                        aria-label={allVisibleSelected ? "Deselect all rows" : "Select all rows"}
                      />
                    </SelectionColumnContent>
                  ) : (
                    <>
                      <span aria-hidden="true">#</span>
                      <span className="sr-only">Row number</span>
                    </>
                  )}
                </th>
              ) : null}
              {columns.map((column, index) => {
                const active = currentSort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? currentSort.direction : undefined}
                    className={[
                      headerCell,
                      "px-4 py-3",
                      alignment[column.align ?? "start"],
                      isFloating && index === 0 && !hasVisibleLeadingColumn && "rounded-l-[14px]",
                      isFloating && index === columns.length - 1 && "rounded-r-[14px]",
                    ].filter(Boolean).join(" ")}
                    style={{ width: column.width }}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        className={[
                          "inline-flex min-h-6 items-center gap-1.5 rounded-[7px] border-0 bg-transparent px-1 text-[11px] font-[650] uppercase tracking-[0.04em] text-inherit transition-colors duration-[var(--duration-fast)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
                          column.align === "end" && "ml-auto",
                          column.align === "center" && "mx-auto",
                        ].filter(Boolean).join(" ")}
                        onClick={() => updateSort(column)}
                      >
                        {column.header}
                        <motion.svg
                          viewBox="0 0 16 16"
                          className={active ? "size-3.5 opacity-100" : "size-3.5 opacity-35"}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          animate={{ rotate: active && currentSort.direction === "descending" ? 180 : 0 }}
                          transition={reduceMotion ? { duration: 0 } : motionTokens.spring.snappy}
                          aria-hidden="true"
                        >
                          <path d="m4.5 9 3.5-3.5L11.5 9" />
                        </motion.svg>
                      </button>
                    ) : column.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isFloating ? (
              <tr aria-hidden="true">
                <td className="h-2 p-0" colSpan={columnCount} />
              </tr>
            ) : null}
            {rows.length ? rows.map(({ row }, visibleIndex) => {
              const rowId = getRowId(row);
              const selected = selectedSet.has(rowId);
              return (
                <motion.tr
                  layout={layoutAnimated ? "position" : false}
                  key={rowId}
                  data-table-row=""
                  data-selected={selected || undefined}
                  className="group relative focus-within:z-[2]"
                  transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
                  onFocus={(event) => moveHover(event.currentTarget)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) hideHover();
                  }}
                >
                  {hasLeadingColumn ? (
                    <td
                      aria-hidden={!hasVisibleLeadingColumn || undefined}
                      className={[
                        "relative h-[3.25rem] bg-transparent text-center text-xs tabular-nums text-[var(--text-secondary)]",
                        showRowNumbers ? "w-14 px-4" : "w-0 px-0",
                        visibleIndex < rows.length - 1 && "border-b border-[var(--border)]",
                      ].filter(Boolean).join(" ")}
                    >
                      {selectable && showRowNumbers ? (
                        <span className="relative mx-auto grid size-5 place-items-center">
                          <span className={[
                            "pointer-events-none transition-[opacity,transform] duration-[var(--duration-standard)] ease-[var(--ease-standard)] group-hover:-translate-y-1.5 group-hover:opacity-0 group-focus-within:-translate-y-1.5 group-focus-within:opacity-0 motion-reduce:transform-none motion-reduce:duration-0",
                            selected ? "-translate-y-1.5 opacity-0" : "translate-y-0 opacity-100",
                          ].join(" ")}>{visibleIndex + 1}</span>
                          <span className={[
                            "absolute inset-0 transition-[opacity,transform] duration-[var(--duration-standard)] ease-[var(--ease-standard)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transform-none motion-reduce:duration-0",
                            selected ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
                          ].join(" ")}>
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) => setRowSelected(rowId, checked)}
                              aria-label={`${selected ? "Deselect" : "Select"} row ${visibleIndex + 1}`}
                            />
                          </span>
                        </span>
                      ) : !showRowNumbers ? (
                        <SelectionColumnContent open={showCheckboxColumn}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) => setRowSelected(rowId, checked)}
                            aria-label={`${selected ? "Deselect" : "Select"} row ${visibleIndex + 1}`}
                          />
                        </SelectionColumnContent>
                      ) : visibleIndex + 1}
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "h-[3.25rem] bg-transparent px-4 py-3.5 align-middle text-sm",
                        alignment[column.align ?? "start"],
                        visibleIndex < rows.length - 1 && "border-b border-[var(--border)]",
                      ].filter(Boolean).join(" ")}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              );
            }) : (
              <tr>
                <td
                  colSpan={columnCount}
                  className="h-28 bg-[var(--surface)] px-5 text-center text-sm text-[var(--text-secondary)]"
                >
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}