"use client";

import {
  PricingCard,
  type PricingCardVariant,
  type PricingFeature,
} from "@/registry/components/pricing-card/pricing-card";

interface PricingCardExampleProps {
  tabMode?: "with-tabs" | "without-tabs";
  variant?: PricingCardVariant;
}

export function PricingCardExample({
  tabMode = "with-tabs",
  variant = "bordered",
}: PricingCardExampleProps) {
  const freeFeatures: PricingFeature[] = [
    { text: "Access to 30+ core UI components" },
    { text: "Community Discord support" },
    { text: "Single personal project" },
    { text: "Copy-paste shadcn CLI support" },
    { text: "All Pro components & blocks", included: false },
    { text: "Commercial multi-client license", included: false },
  ];

  const proFeatures: PricingFeature[] = [
    { text: "Full access to all Pro components & blocks" },
    {
      text: (tab) =>
        tab === "yearly"
          ? "Unlimited production projects (Annual perk)"
          : "Up to 5 production projects",
    },
    {
      text: (tab) =>
        tab === "yearly"
          ? "Includes 2 months free with annual billing"
          : "Flexible monthly billing, cancel anytime",
    },
    { text: "Commercial license for unlimited clients" },
    { text: "Continuous weekly catalog updates" },
    { text: "Priority direct developer support" },
  ];

  const staticProFeatures: PricingFeature[] = [
    { text: "Full access to all Pro components & blocks" },
    { text: "Unlimited production projects & sites" },
    { text: "Annual billing: includes 2 months free" },
    { text: "Commercial license for unlimited clients" },
    { text: "Continuous weekly catalog updates" },
    { text: "Priority direct developer support" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 p-4 md:grid-cols-2">
      {/* Left: Free tier card (Static, no tabs) */}
      <PricingCard
        name="Starter Free"
        description="Essential UI primitives for individual builders and exploration."
        badge="Free Tier"
        badgeTone="neutral"
        variant={variant}
        highlight={false}
        price={0}
        features={freeFeatures}
        action={{
          label: "Get Started Free",
          variant: "bordered",
          href: "#",
        }}
      />

      {/* Right: Pro tier card (Interactive with Monthly/Yearly tabs, or static annual) */}
      {tabMode === "with-tabs" ? (
        <PricingCard
          name="Pro All-Access"
          description="Production-ready UI library with premium blocks and full source code."
          badge={(tab) => (tab === "yearly" ? "Save 20%" : "Popular")}
          badgeTone="success"
          variant={variant}
          highlight
          tabs={[
            { key: "monthly", label: "Monthly", interval: "mo", subPrice: "billed monthly" },
            { key: "yearly", label: "Yearly", interval: "yr", badge: "-20%", subPrice: "billed annually" },
          ]}
          defaultTab="monthly"
          price={{
            monthly: 19,
            yearly: 190,
          }}
          features={proFeatures}
          action={(tab) => ({
            label: tab === "monthly" ? "Start Monthly Pro" : "Start Yearly Pro",
            variant: "filled",
            tone: "primary",
            href: "#",
          })}
        />
      ) : (
        <PricingCard
          name="Pro All-Access"
          description="Production-ready UI library with premium blocks and full source code."
          badge="Best Value"
          badgeTone="success"
          variant={variant}
          highlight
          price={190}
          interval="yr"
          subPrice="billed annually"
          features={staticProFeatures}
          action={{
            label: "Get All-Access",
            variant: "filled",
            tone: "primary",
            href: "#",
          }}
        />
      )}
    </div>
  );
}
