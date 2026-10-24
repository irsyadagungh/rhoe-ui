import type { ReactNode } from "react";
import { Code2, Eye } from "lucide-react";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "./preview-canvas";
import styles from "../catalog.module.css";

export interface ComponentPreviewVariant {
  value: string;
  label: string;
  preview: ReactNode;
}

export function ComponentPreview({
  preview,
  sandbox,
  code,
  filename,
  variants = [],
  showReplay = true,
}: {
  preview?: ReactNode;
  sandbox?: ReactNode;
  code: string;
  filename: string;
  variants?: ComponentPreviewVariant[];
  showReplay?: boolean;
}) {
  const previewContent = sandbox ?? (variants.length ? (
    <Tabs
      variant="flat"
      ariaLabel="Preview variant"
      listClassName={styles.previewVariantTabs}
      panelClassName={styles.previewVariantPanel}
      items={variants.map((variant) => ({
        value: variant.value,
        label: variant.label,
        content: (
          <PreviewCanvas identity={variant.value} showReplay={showReplay}>
            {variant.preview}
          </PreviewCanvas>
        ),
      }))}
    />
  ) : (
    <PreviewCanvas showReplay={showReplay}>{preview}</PreviewCanvas>
  ));

  return (
    <div className={styles.componentPreview}>
      <Tabs
        variant="flat"
        ariaLabel="Component preview"
        panelClassName={styles.componentPreviewCard}
        animatePanelHeight
        items={[
          {
            value: "preview",
            label: "Preview",
            icon: <Eye size={15} />,
            content: previewContent,
          },
          {
            value: "code",
            label: "Code",
            icon: <Code2 size={15} />,
            content: (
              <CodeBlock
                code={code}
                language="tsx"
                filename={filename}
                variant="embedded"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
