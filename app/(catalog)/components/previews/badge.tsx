import { Check, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Badge, type BadgeVariant } from "@/registry/components/badge/badge";
import styles from "../preview-styles/badge.module.css";

const tones = ["neutral", "success", "warning", "danger"] as const;
const icons = { neutral: <Info />, success: <Check />, warning: <TriangleAlert />, danger: <CircleAlert /> };

export function BadgeExample({ variant }: { variant: BadgeVariant }) {
  return (
    <div className={styles.grid}>
      {tones.map((tone) => <Badge key={tone} variant={variant} tone={tone} icon={icons[tone]}>{tone}</Badge>)}
      <Badge
        variant={variant}
        color="var(--focus)"
        backgroundColor="color-mix(in srgb, var(--focus) 14%, var(--surface))"
        borderColor="color-mix(in srgb, var(--focus) 54%, transparent)"
      >
        Custom
      </Badge>
    </div>
  );
}
