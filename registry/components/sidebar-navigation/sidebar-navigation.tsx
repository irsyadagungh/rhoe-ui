"use client";

import {
  type ComponentType,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface SidebarNavigationItem {
  href?: string;
  label: string;
  /** Optional count displayed beside a parent item. Zero is displayed. */
  count?: number;
  children?: SidebarNavigationItem[];
  defaultExpanded?: boolean;
}

export interface SidebarNavigationGroup {
  label: string;
  /** Optional total displayed beside the group heading. Zero is displayed. */
  count?: number;
  items: SidebarNavigationItem[];
  defaultExpanded?: boolean;
}

export interface SidebarNavigationLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page";
  onClick?: () => void;
  onPointerEnter?: (event: React.PointerEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}

export interface SidebarNavigationProps {
  groups: SidebarNavigationGroup[];
  activeHref?: string;
  ariaLabel?: string;
  onActiveHrefChange?: (href: string) => void;
  /** Custom link component, e.g. `next/link` or React Router's `Link`. Defaults to `<a>`. */
  renderLink?: ComponentType<SidebarNavigationLinkProps>;
}

interface VisibleItem {
  item: SidebarNavigationItem;
  id: string;
  depth: number;
}

const rowHeight = 35;
const still = { duration: 0 } as const;
const parentButtonClass = "relative my-px flex h-[33px] w-full min-w-0 items-center justify-between border-0 bg-transparent px-[7px] text-left leading-[1.35] font-[560] text-[var(--text)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2";
const pathOnly = (href: string) => href.split("#")[0];
const itemId = (item: SidebarNavigationItem, parent = "") =>
  `${parent}/${item.href ?? item.label}`;

function containsActive(item: SidebarNavigationItem, activeHref?: string): boolean {
  if (!activeHref) return false;
  return (
    (item.href ? pathOnly(item.href) === pathOnly(activeHref) : false) ||
    item.children?.some((child) => containsActive(child, activeHref)) === true
  );
}

function initialExpandedItems(
  items: SidebarNavigationItem[],
  activeHref?: string,
  parent = "",
) {
  const expanded = new Set<string>();

  for (const item of items) {
    const id = itemId(item, parent);
    if (item.children?.length && (item.defaultExpanded || containsActive(item, activeHref))) {
      expanded.add(id);
    }
    if (item.children) {
      for (const child of initialExpandedItems(item.children, activeHref, id)) {
        expanded.add(child);
      }
    }
  }

  return expanded;
}

function flattenItems(
  items: SidebarNavigationItem[],
  expanded: ReadonlySet<string>,
  depth = 1,
  parent = "",
): VisibleItem[] {
  return items.flatMap((item) => {
    const id = itemId(item, parent);
    return [
      { item, id, depth },
      ...(item.children?.length && expanded.has(id)
        ? flattenItems(item.children, expanded, depth + 1, id)
        : []),
    ];
  });
}

export function SidebarNavigation({
  groups,
  activeHref,
  ariaLabel = "Sidebar navigation",
  onActiveHrefChange,
  renderLink,
}: SidebarNavigationProps) {
  const LinkComponent = renderLink ?? "a";
  const reduceMotion = useReducedMotion() ?? false;
  const navigationRef = useRef<HTMLElement>(null);
  const selectedReady = useRef(false);
  const hoverVisible = useRef(false);
  const selectedX = useMotionValue(0);
  const selectedY = useMotionValue(0);
  const selectedWidth = useMotionValue(0);
  const selectedHeight = useMotionValue(0);
  const selectedOpacity = useMotionValue(0);
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const hoverWidth = useMotionValue(0);
  const hoverHeight = useMotionValue(0);
  const hoverOpacity = useMotionValue(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(
    () =>
      new Set(
        groups
          .filter(
            (group) =>
              group.defaultExpanded !== false ||
              group.items.some((item) => containsActive(item, activeHref)),
          )
          .map((group) => group.label),
      ),
  );
  const [expandedItems, setExpandedItems] = useState(() => {
    const expanded = new Set<string>();
    for (const group of groups) {
      for (const id of initialExpandedItems(group.items, activeHref, group.label)) {
        expanded.add(id);
      }
    }
    return expanded;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const measure = (element: HTMLElement) => {
    const navigation = navigationRef.current;
    if (!navigation) return null;
    const navigationRect = navigation.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return {
      x: elementRect.left - navigationRect.left,
      y: elementRect.top - navigationRect.top,
      width: elementRect.width,
      height: elementRect.height,
    };
  };

  const moveHover = (element: HTMLElement) => {
    const target = measure(element);
    if (!target) return;
    const transition = reduceMotion ? still : motionTokens.spring.smooth;

    if (!hoverVisible.current || reduceMotion) {
      hoverX.jump(target.x);
      hoverY.jump(target.y);
      hoverWidth.jump(target.width);
      hoverHeight.jump(target.height);
    } else {
      animate(hoverX, target.x, transition);
      animate(hoverY, target.y, transition);
      animate(hoverWidth, target.width, transition);
      animate(hoverHeight, target.height, transition);
    }
    hoverVisible.current = true;
    animate(hoverOpacity, 1, { duration: reduceMotion ? 0 : 0.08 });
  };

  const hideHover = () => {
    hoverVisible.current = false;
    animate(hoverOpacity, 0, { duration: reduceMotion ? 0 : 0.08 });
  };

  useLayoutEffect(() => {
    const activePath = activeHref ? pathOnly(activeHref) : "";
    const activeItemIsVisible = groups.some(
      (group) =>
        expandedGroups.has(group.label) &&
        flattenItems(group.items, expandedItems, 1, group.label).some(
          ({ item }) =>
            !item.children?.length &&
            Boolean(item.href && pathOnly(item.href) === activePath),
        ),
    );

    if (!activeItemIsVisible) {
      selectedReady.current = false;
      selectedOpacity.jump(0);
      return;
    }

    const navigation = navigationRef.current;
    const selected = navigation?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!selected) {
      selectedReady.current = false;
      selectedOpacity.jump(0);
      return;
    }

    const selectedRow = selected.closest<HTMLElement>(".sya-sidebar-row");
    if (
      selectedRow &&
      selectedRow.getBoundingClientRect().height < rowHeight - 0.5
    ) {
      selectedReady.current = false;
      selectedOpacity.jump(0);
      return;
    }

    const target = measure(selected);
    if (!target) return;
    const transition = reduceMotion ? still : motionTokens.spring.morph;

    if (!selectedReady.current || reduceMotion) {
      selectedX.jump(target.x);
      selectedY.jump(target.y);
      selectedWidth.jump(target.width);
      selectedHeight.jump(target.height);
    } else {
      animate(selectedX, target.x, transition);
      animate(selectedY, target.y, transition);
      animate(selectedWidth, target.width, transition);
      animate(selectedHeight, target.height, transition);
    }
    selectedReady.current = true;
    selectedOpacity.jump(1);
  }, [activeHref, expandedGroups, expandedItems, groups, layoutVersion, reduceMotion, selectedHeight, selectedOpacity, selectedWidth, selectedX, selectedY]);

  return (
    <nav
      ref={navigationRef}
      className="relative grid gap-1"
      aria-label={ariaLabel}
      onPointerLeave={hideHover}
    >
      <motion.span
        className="pointer-events-none absolute top-0 left-0 z-0 rounded-[7px] bg-[color-mix(in_srgb,var(--surface-muted)_72%,transparent)]"
        style={{
          x: hoverX,
          y: hoverY,
          width: hoverWidth,
          height: hoverHeight,
          opacity: hoverOpacity,
        }}
        aria-hidden="true"
      />
      <motion.span
        className="pointer-events-none absolute top-0 left-0 z-0 rounded-[7px] bg-[color-mix(in_srgb,var(--text)_7%,var(--surface-muted))]"
        style={{
          x: selectedX,
          y: selectedY,
          width: selectedWidth,
          height: selectedHeight,
          opacity: selectedOpacity,
        }}
        aria-hidden="true"
      />
        {groups.map((group) => {
          const groupOpen = expandedGroups.has(group.label);
          const panelId = `sidebar-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const visibleItems = groupOpen
            ? flattenItems(group.items, expandedItems, 1, group.label)
            : [];

          return (
            <section className="relative z-[1] min-w-0" key={group.label}>
              <button
                className={`${parentButtonClass} text-[11px] tracking-[0.055em] uppercase`}
                type="button"
                aria-expanded={groupOpen}
                aria-controls={panelId}
                onClick={() => toggleGroup(group.label)}
              >
                <span className="relative z-[1] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{group.label}</span>
                <span className="relative z-[1] inline-flex min-w-0 items-center gap-[7px]">
                  {group.count !== undefined ? (
                    <span className="text-[11px] leading-none font-[560] tabular-nums text-[var(--text-secondary)]">{group.count}</span>
                  ) : null}
                  <motion.span
                    className="grid h-4 w-[13px] shrink-0 basis-[13px] place-items-center text-[var(--text-secondary)]"
                    initial={false}
                    animate={{ rotate: groupOpen ? 90 : 0 }}
                    transition={reduceMotion ? still : motionTokens.spring.snappy}
                    aria-hidden="true"
                  >
                    <ChevronRight size={13} />
                  </motion.span>
                </span>
              </button>

              <div className="my-[3px] mb-px min-w-0" id={panelId}>
                <AnimatePresence initial={false} mode="sync">
                  {visibleItems.map(({ item, id, depth }, index) => {
                    const hasChildren = Boolean(item.children?.length);
                    const itemOpen = hasChildren && expandedItems.has(id);
                    const active =
                      !hasChildren &&
                      Boolean(
                        item.href &&
                          activeHref &&
                          pathOnly(item.href) === pathOnly(activeHref),
                      );
                    const delay = Math.min(index, 7) * motionTokens.stagger.item;

                    return (
                      <motion.div
                        className="sya-sidebar-row relative flow-root h-[35px] min-w-0"
                        key={id}
                        initial={
                          reduceMotion
                            ? false
                            : { height: 0, opacity: 0, x: -6, overflow: "hidden" }
                        }
                        animate={{
                          height: rowHeight,
                          opacity: 1,
                          x: 0,
                          pointerEvents: "auto",
                          transitionEnd: { overflow: "visible" },
                          transition: reduceMotion
                            ? still
                            : {
                                height: motionTokens.spring.smooth,
                                opacity: {
                                  duration: motionTokens.duration.fast,
                                  ease: motionTokens.ease.enter,
                                  delay,
                                },
                                x: { ...motionTokens.spring.smooth, delay },
                              },
                        }}
                        exit={
                          reduceMotion
                            ? { opacity: 0, transition: still }
                            : {
                                height: 0,
                                opacity: 0,
                                x: -4,
                                overflow: "hidden",
                                pointerEvents: "none",
                                transition: {
                                  height: motionTokens.spring.smooth,
                                  opacity: {
                                    duration: motionTokens.duration.instant,
                                    ease: motionTokens.ease.standard,
                                  },
                                  x: {
                                    duration: motionTokens.duration.instant,
                                    ease: motionTokens.ease.standard,
                                  },
                                },
                            }
                        }
                        onAnimationComplete={() => {
                          if (active) setLayoutVersion((version) => version + 1);
                        }}
                      >
                        {!hasChildren && depth > 1 ? (
                          <span className="pointer-events-none absolute -top-px -bottom-px left-[13px] z-[2] w-px bg-[var(--border)]" aria-hidden="true" />
                        ) : null}
                        {hasChildren ? (
                          <button
                            className={`${parentButtonClass} text-[13px]`}
                            type="button"
                            aria-expanded={itemOpen}
                            onClick={() => toggleItem(id)}
                          >
                            <span className="relative z-[1] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
                            <span className="relative z-[1] inline-flex min-w-0 items-center gap-[7px]">
                              {item.count !== undefined ? (
                                <span className="text-[11px] leading-none font-[560] tabular-nums text-[var(--text-secondary)]">{item.count}</span>
                              ) : null}
                              <motion.span
                                className="grid h-4 w-[13px] shrink-0 basis-[13px] place-items-center text-[var(--text-secondary)]"
                                initial={false}
                                animate={{ rotate: itemOpen ? 90 : 0 }}
                                transition={
                                  reduceMotion ? still : motionTokens.spring.snappy
                                }
                                aria-hidden="true"
                              >
                                <ChevronRight size={13} />
                              </motion.span>
                            </span>
                          </button>
                        ) : item.href ? (
                          <LinkComponent
                            className={["relative my-px ml-5 flex h-[33px] min-w-0 items-center rounded-[7px] px-[9px] text-[13px] leading-[1.35] no-underline transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2", active ? "text-[var(--text)]" : "text-[var(--text-secondary)]"].join(" ")}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => onActiveHrefChange?.(item.href!)}
                            onPointerEnter={(event) =>
                              moveHover(event.currentTarget)
                            }
                          >
                            <span className="relative z-[1] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
                          </LinkComponent>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>
          );
        })}
    </nav>
  );
}
