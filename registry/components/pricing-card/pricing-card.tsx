"use client";

import { useId, useState, type CSSProperties } from "react";
import { Check, Minus } from "lucide-react";
import { Button, ButtonLink, type ButtonVariant, type ButtonTone } from "../button/button";
import { Badge, type BadgeTone } from "../badge/badge";
import { Tabs } from "../tabs/tabs";
import { RollingNumber } from "../rolling-number/rolling-number";
import { MorphingText } from "../morphing-text/morphing-text";
import "../foundation.css";

export type PricingCardVariant = "bordered" | "filled";

export interface PricingTab {
  /** Unique key identifying the tab, e.g. "monthly" or "yearly". */
  key: string;
  /** Label rendered inside the tab button. */
  label: string;
  /** Optional badge or discount tag, e.g. "Save 20%". */
  badge?: string;
  /** Billing interval suffix associated with this tab, e.g. "mo" or "yr". */
  interval?: string;
  /** Optional secondary billing caption rendered beneath interval, e.g. "billed monthly". */
  subPrice?: string | null;
}

export interface PricingFeature {
  /** Feature description text, or dynamic resolver function receiving the active tab key. */
  text: string | ((tab: string) => string);
  /** Whether the feature is included in this tier or tab. Defaults to true. */
  included?: boolean | ((tab: string) => boolean);
  /** Renders the text in a heavier weight — for short announcements like an upcoming plan. */
  bold?: boolean;
}

export interface PricingCardAction {
  /** Label for the call-to-action button. */
  label: string;
  /** Click handler for button action. */
  onClick?: () => void;
  /** Link target for anchor action. */
  href?: string;
  /** Visual variant: "filled", "bordered", "text", or "action". */
  variant?: ButtonVariant;
  /** Semantic color tone. Defaults to "primary". */
  tone?: ButtonTone;
  /** Disables user interaction. */
  disabled?: boolean;
}

export interface PricingCardProps {
  /** Tier name, e.g. "Pro" or a dynamic resolver function receiving the active tab key. */
  name: string | ((tab: string) => string);
  /** Short description explaining target audience or tier value. */
  description?: string | ((tab: string) => string | undefined);
  /** Visual container surface treatment: "bordered" (default) or "filled". */
  variant?: PricingCardVariant;
  /** Optional badge label rendered in header, e.g. "Popular" or "Best Value". */
  badge?: string | ((tab: string) => string | undefined);
  /** Semantic tone for the badge. Defaults to "success" when highlighted, else "neutral". */
  badgeTone?: BadgeTone | ((tab: string) => BadgeTone | undefined);
  /** Highlights the card with primary border, subtle elevation, and prominent styling. */
  highlight?: boolean;
  /** Custom border color override (e.g. for highlight accent or custom brand colors). */
  borderColor?: string;
  /** Custom inline style properties for the card container. */
  style?: CSSProperties;
  /** Numeric price: a static number, an object map keyed by tab, or a dynamic resolver. */
  price: number | Record<string, number> | ((tab: string) => number);
  /** Currency symbol, defaults to "$". */
  currency?: string;
  /** Active tab key when controlled externally. */
  activeTab?: string;
  /** Default initial tab key when uncontrolled. Defaults to the first tab's key. */
  defaultTab?: string;
  /** Suffix shown after the price (e.g. "mo", "yr"). If omitted, uses active tab's interval. */
  interval?: string | ((tab: string) => string | undefined);
  /** Optional secondary caption below interval, e.g. "billed monthly". Omitted if null or undefined. */
  subPrice?: string | null | ((tab: string) => string | null | undefined);
  /** Optional list of tabs rendered internally in the card header. */
  tabs?: PricingTab[];
  /** Callback fired when tab selection changes. */
  onTabChange?: (tabKey: string) => void;
  /** List of features. Text and availability morph smoothly on tab transitions. */
  features: PricingFeature[];
  /** Optional call-to-action button or link rendered at the bottom. */
  action?: PricingCardAction | ((tab: string) => PricingCardAction | undefined);
  /** Additional CSS class names for the card container. */
  className?: string;
}

export function PricingCard({
  name,
  description,
  variant = "bordered",
  badge,
  badgeTone,
  highlight = false,
  borderColor,
  price,
  currency = "$",
  activeTab: controlledTab,
  defaultTab,
  interval,
  subPrice,
  tabs,
  onTabChange,
  features,
  action,
  className,
  style,
}: PricingCardProps) {
  const headingId = useId();
  const [internalTab, setInternalTab] = useState<string>(
    defaultTab ?? tabs?.[0]?.key ?? "",
  );
  const currentTab = controlledTab ?? internalTab;

  const handleTabChange = (nextKey: string) => {
    if (controlledTab === undefined) {
      setInternalTab(nextKey);
    }
    onTabChange?.(nextKey);
  };

  const resolvedName = typeof name === "function" ? name(currentTab) : name;
  const resolvedDescription =
    typeof description === "function" ? description(currentTab) : description;
  const resolvedBadge = typeof badge === "function" ? badge(currentTab) : badge;
  const resolvedBadgeTone =
    typeof badgeTone === "function" ? badgeTone(currentTab) : badgeTone;

  const numericPrice =
    typeof price === "function"
      ? price(currentTab)
      : typeof price === "number"
        ? price
        : (price[currentTab] ?? 0);

  const activeTabItem = tabs?.find((tab) => tab.key === currentTab);
  const resolvedInterval =
    typeof interval === "function"
      ? interval(currentTab)
      : typeof interval === "string"
        ? interval
        : activeTabItem?.interval;
  const resolvedSubPrice =
    typeof subPrice === "function"
      ? subPrice(currentTab)
      : typeof subPrice === "string"
        ? subPrice
        : activeTabItem?.subPrice;

  const resolvedAction = typeof action === "function" ? action(currentTab) : action;

  return (
    <article
      aria-labelledby={headingId}
      style={{
        ...style,
        ...(borderColor ? { borderColor } : {}),
      }}
      className={[
        "relative flex w-full flex-col justify-between rounded-[24px] border p-6 text-[var(--text)] transition-all duration-[var(--duration-standard)]",
        variant === "bordered" && "bg-[var(--surface)]",
        variant === "filled" && "bg-[var(--surface-muted)]",
        !highlight && variant === "bordered" && "border-[var(--border)] shadow-[var(--shadow-resting)]",
        !highlight && variant === "filled" && "border-transparent",
        highlight && "border-[var(--primary)] shadow-[var(--shadow-floating)] ring-1 ring-[var(--primary)]/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        {/* Top bar: Badge on top-left, Tabs on top-right */}
        <div className="flex items-center justify-between gap-3">
          {resolvedBadge ? (
            <Badge
              variant="filled"
              tone={resolvedBadgeTone ?? (highlight ? "success" : "neutral")}
            >
              {resolvedBadge}
            </Badge>
          ) : (
            <div />
          )}

          {tabs && tabs.length > 0 ? (
            <Tabs
              variant="grouped"
              ariaLabel="Pricing cycle"
              items={tabs.map((tab) => ({
                value: tab.key,
                label: tab.badge ? `${tab.label} · ${tab.badge}` : tab.label,
                content: null,
              }))}
              value={currentTab}
              onValueChange={handleTabChange}
            />
          ) : null}
        </div>

        {/* Plan name (with MorphingText) and description */}
        <div className="mt-4 flex flex-col gap-1.5">
          <h3 id={headingId} className="text-xl font-[700] tracking-tight text-[var(--text)]">
            <MorphingText value={resolvedName} />
          </h3>
          {resolvedDescription ? (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {resolvedDescription}
            </p>
          ) : null}
        </div>

        {/* Price display with RollingNumber */}
        <div className="my-6 flex items-baseline gap-1.5">
          <span className="text-2xl font-[600] text-[var(--text-secondary)]">
            {currency}
          </span>
          <RollingNumber
            value={numericPrice}
            className="text-4xl font-[800] tracking-tight text-[var(--text)] md:text-5xl"
          />
          {resolvedInterval || resolvedSubPrice ? (
            resolvedSubPrice ? (
              <div className="flex flex-col self-end pb-0.5 leading-tight">
                {resolvedInterval ? (
                  <span className="text-sm font-[500] text-[var(--text-secondary)]">
                    /{resolvedInterval}
                  </span>
                ) : null}
                <span className="text-[11px] font-[450] text-[var(--text-secondary)] opacity-80">
                  {resolvedSubPrice}
                </span>
              </div>
            ) : (
              <span className="text-sm font-[500] text-[var(--text-secondary)]">
                /{resolvedInterval}
              </span>
            )
          ) : null}
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          {/* Benefit features list */}
          <ul className="flex flex-col gap-3.5" role="list">
            {features.map((feature, index) => {
              const included =
                typeof feature.included === "function"
                  ? feature.included(currentTab)
                  : (feature.included ?? true);
              const textValue =
                typeof feature.text === "function"
                  ? feature.text(currentTab)
                  : feature.text;

              return (
                <li key={index} className="flex items-start gap-3 text-sm">
                  {included ? (
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--success-surface)] text-[var(--success-surface-foreground)]"
                      aria-hidden="true"
                    >
                      <Check className="size-3 stroke-[2.5]" />
                    </span>
                  ) : (
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] opacity-60"
                      aria-hidden="true"
                    >
                      <Minus className="size-3 stroke-[2]" />
                    </span>
                  )}
                  <span
                    className={[
                      "leading-snug",
                      included
                        ? "text-[var(--text)]"
                        : "text-[var(--text-secondary)] line-through opacity-60",
                      feature.bold ? "font-[600]" : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="sr-only">
                      {included ? "Included: " : "Not included: "}
                    </span>
                    <MorphingText value={textValue} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Optional action CTA button */}
      {resolvedAction ? (
        <div className="mt-8 pt-2">
          {resolvedAction.href ? (
            <ButtonLink
              href={resolvedAction.href}
              variant={resolvedAction.variant ?? (highlight ? "filled" : "bordered")}
              tone={resolvedAction.tone ?? "primary"}
              size="large"
              className="w-full justify-center text-sm font-[650]"
            >
              {resolvedAction.label}
            </ButtonLink>
          ) : (
            <Button
              type="button"
              onClick={resolvedAction.onClick}
              disabled={resolvedAction.disabled}
              variant={resolvedAction.variant ?? (highlight ? "filled" : "bordered")}
              tone={resolvedAction.tone ?? "primary"}
              size="large"
              className="w-full justify-center text-sm font-[650]"
            >
              {resolvedAction.label}
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}
