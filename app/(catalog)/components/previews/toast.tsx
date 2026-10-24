"use client";

import { useState } from "react";
import { Check, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Button, type ButtonTone } from "@/registry/components/button/button";
import { Tabs } from "@/registry/components/tabs/tabs";
import {
  ToastProvider,
  useToast,
  type ToastFill,
  type ToastPosition,
  type ToastTone,
  type ToastVariant,
} from "@/registry/components/toast/toast";
import { PreviewCanvas } from "../preview-canvas";
import styles from "../preview-styles/toast.module.css";

const icons = {
  neutral: <Info />,
  success: <Check />,
  warning: <TriangleAlert />,
  danger: <CircleAlert />,
};

const labels = {
  neutral: "Your workspace settings have been saved and are now available to everyone on your team.",
  success: "Your deployment completed successfully. The latest changes are now live for everyone.",
  warning: "Storage is almost full. Review your latest uploads before they prevent new deployments.",
  danger: "The deployment could not be completed. Review the build log and try again when the issue is resolved.",
};

const positions: { value: ToastPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

function ToastTrigger({
  tone,
  variant,
  fill,
  withIcon,
}: {
  tone: ToastTone;
  variant: ToastVariant;
  fill: ToastFill;
  withIcon: boolean;
}) {
  const { toast } = useToast();
  const buttonTone: ButtonTone = tone === "neutral" ? "secondary" : tone;

  return (
    <Button
      tone={buttonTone}
      onClick={() => toast({
        text: labels[tone],
        icon: withIcon ? icons[tone] : undefined,
        tone,
        variant,
        fill,
      })}
    >
      Trigger toast
    </Button>
  );
}

function PositionPicker({
  position,
  onChange,
}: {
  position: ToastPosition;
  onChange: (position: ToastPosition) => void;
}) {
  return (
    <fieldset className={styles.positionPicker}>
      <legend className="sr-only">Toast position</legend>
      {positions.map((item) => {
        const selected = position === item.value;
        return (
          <label className={styles.positionOption} data-selected={selected || undefined} key={item.value}>
            <input
              checked={selected}
              className="sr-only"
              name="toast-preview-position"
              type="radio"
              value={item.value}
              onChange={() => onChange(item.value)}
            />
            <span className={styles.positionMark} aria-hidden="true">{selected ? <Check /> : null}</span>
            <span>{item.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

export function ToastSandbox() {
  const [tone, setTone] = useState<ToastTone>("success");
  const [variant, setVariant] = useState<ToastVariant>("filled");
  const [fill, setFill] = useState<ToastFill>("tinted");
  const [position, setPosition] = useState<ToastPosition>("bottom-right");
  const [withIcon, setWithIcon] = useState(true);

  return (
    <ToastProvider position={position} stackLimit={3} duration={12000}>
      <PreviewCanvas
        showReplay={false}
        toolbar={(
          <div className={styles.controls}>
            <Tabs
              variant="flat"
              ariaLabel="Toast tone"
              value={tone}
              onValueChange={(value) => setTone(value as ToastTone)}
              items={[
                { value: "neutral", label: "Neutral", content: <span /> },
                { value: "success", label: "Success", content: <span /> },
                { value: "warning", label: "Warning", content: <span /> },
                { value: "danger", label: "Danger", content: <span /> },
              ]}
            />
            <Tabs
              variant="flat"
              ariaLabel="Toast variant"
              value={variant}
              onValueChange={(value) => setVariant(value as ToastVariant)}
              items={[
                { value: "filled", label: "Filled", content: <span /> },
                { value: "bordered", label: "Bordered", content: <span /> },
              ]}
            />
            {variant === "filled" ? (
              <Tabs
                variant="flat"
                ariaLabel="Toast fill"
                value={fill}
                onValueChange={(value) => setFill(value as ToastFill)}
                items={[
                  { value: "tinted", label: "Tinted", content: <span /> },
                  { value: "solid", label: "Solid", content: <span /> },
                ]}
              />
            ) : null}
            <Tabs
              variant="flat"
              ariaLabel="Toast icon"
              value={withIcon ? "icon" : "text"}
              onValueChange={(value) => setWithIcon(value === "icon")}
              items={[
                { value: "icon", label: "With icon", content: <span /> },
                { value: "text", label: "Text only", content: <span /> },
              ]}
            />
          </div>
        )}
      >
        <div className={styles.previewContent}>
          <PositionPicker position={position} onChange={setPosition} />
          <ToastTrigger tone={tone} variant={variant} fill={fill} withIcon={withIcon} />
        </div>
      </PreviewCanvas>
    </ToastProvider>
  );
}
