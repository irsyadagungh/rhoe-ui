"use client";

import { useState } from "react";
import { Archive, Box, FileText, Layers } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  ExpandingSearch,
  type ExpandingSearchAnchor,
  type ExpandingSearchItem,
  type ExpandingSearchPanelSize,
  type ExpandingSearchTrigger,
} from "@/registry/components/expanding-search/expanding-search";
import { Tabs } from "@/registry/components/tabs/tabs";
import type { ButtonSize } from "@/registry/components/button/button";
import type { InputVariant } from "@/registry/components/input/input";
import type { AnimatedListDescriptionPlacement, AnimatedListItemVariant } from "@/registry/components/animated-list/animated-list";
import { PreviewCanvas } from "../preview-canvas";
import styles from "../preview-styles/expanding-search.module.css";

const initialItems: ExpandingSearchItem[] = [
  { value: "button", label: "Button", description: "Actions", icon: <Box />, keywords: ["control", "action"] },
  { value: "input", label: "Input", description: "Forms", icon: <FileText />, keywords: ["field", "text"] },
  { value: "tabs", label: "Tabs", description: "Navigation", icon: <Layers />, keywords: ["navigation"] },
];

export function ExpandingSearchSandbox() {
  const [trigger, setTrigger] = useState<ExpandingSearchTrigger>("icon");
  const [anchor, setAnchor] = useState<ExpandingSearchAnchor>("center");
  const [size, setSize] = useState<ButtonSize>("medium");
  const [panelSize, setPanelSize] = useState<ExpandingSearchPanelSize>("medium");
  const [surfaceVariant, setSurfaceVariant] = useState<InputVariant>("filled");
  const [itemVariant, setItemVariant] = useState<AnimatedListItemVariant>("transparent");
  const [descriptionPlacement, setDescriptionPlacement] = useState<AnimatedListDescriptionPlacement>("below");
  const [listDense, setListDense] = useState(true);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const placement = anchor === "start" ? styles.left : anchor === "end" ? styles.right : styles.center;

  return (
    <PreviewCanvas
      showReplay={false}
      expandable
      expanded={open}
      toolbar={
        <div className={styles.controls}>
          <Tabs
            variant="flat"
            ariaLabel="Search trigger"
            value={trigger}
            onValueChange={(nextValue) => setTrigger(nextValue as ExpandingSearchTrigger)}
            items={[
              { value: "icon", label: "Icon", content: <span /> },
              { value: "icon-text", label: "Icon & text", content: <span /> },
              { value: "field", label: "Field", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search control size"
            value={size}
            onValueChange={(nextValue) => setSize(nextValue as ButtonSize)}
            items={[
              { value: "small", label: "Small", content: <span /> },
              { value: "medium", label: "Medium", content: <span /> },
              { value: "large", label: "Large", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search panel size"
            value={panelSize}
            onValueChange={(nextValue) => setPanelSize(nextValue as ExpandingSearchPanelSize)}
            items={[
              { value: "small", label: "Panel small", content: <span /> },
              { value: "medium", label: "Panel medium", content: <span /> },
              { value: "large", label: "Panel large", content: <span /> },
              { value: "xl", label: "Panel XL", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search surface variant"
            value={surfaceVariant}
            onValueChange={(nextValue) => setSurfaceVariant(nextValue as InputVariant)}
            items={[
              { value: "filled", label: "Filled", content: <span /> },
              { value: "bordered", label: "Bordered", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search item variant"
            value={itemVariant}
            onValueChange={(nextValue) => setItemVariant(nextValue as AnimatedListItemVariant)}
            items={[
              { value: "transparent", label: "Transparent", content: <span /> },
              { value: "filled", label: "Filled", content: <span /> },
              { value: "bordered", label: "Bordered", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search result metadata placement"
            value={descriptionPlacement}
            onValueChange={(nextValue) => setDescriptionPlacement(nextValue as AnimatedListDescriptionPlacement)}
            items={[
              { value: "below", label: "Description below", content: <span /> },
              { value: "inline", label: "Description inline", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search list density"
            value={listDense ? "dense" : "comfortable"}
            onValueChange={(nextValue) => setListDense(nextValue === "dense")}
            items={[
              { value: "dense", label: "Dense", content: <span /> },
              { value: "comfortable", label: "Comfortable", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Search anchor"
            value={String(anchor)}
            onValueChange={(nextValue) => setAnchor(nextValue as Exclude<ExpandingSearchAnchor, number>)}
            items={[
              { value: "start", label: "Left", content: <span /> },
              { value: "center", label: "Center", content: <span /> },
              { value: "end", label: "Right", content: <span /> },
            ]}
          />
        </div>
      }
    >
      <div className={[styles.previewPosition, placement].join(" ")}>
        <motion.div
          layout="position"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
        >
          <ExpandingSearch
            open={open}
            onOpenChange={setOpen}
            trigger={trigger}
            anchor={anchor}
            defaultItems={initialItems}
            panelSize={panelSize}
            fieldWidth={360}
            size={size}
            variant={surfaceVariant}
            itemVariant={itemVariant}
            listDense={listDense}
            animatedListProps={{ replay: "never", stagger: 0 }}
            itemProps={(item) => ({
              descriptionPlacement,
              swipeActions: item.value === "input" ? {
                right: {
                  label: "Archive",
                  icon: <Archive />,
                  onAction: () => undefined,
                },
              } : undefined,
            })}
            onItemSelect={() => undefined}
          />
        </motion.div>
      </div>
    </PreviewCanvas>
  );
}
