"use client";

import { Info } from "lucide-react";
import { Tooltip, type TooltipSize, type TooltipVariant } from "@/registry/components/tooltip/tooltip";
import { PreviewSizeTabs } from "./size-tabs";

export function TooltipExample({ variant }: { variant: TooltipVariant }) {
  return (
    <PreviewSizeTabs>
      {(size) => (
        <div className="flex min-h-36 items-center justify-center py-10">
          <Tooltip
            aria-label="More information about collaborators"
            content="Invite teammates and manage their access."
            icon={<Info />}
            size={size as TooltipSize}
            variant={variant}
          />
        </div>
      )}
    </PreviewSizeTabs>
  );
}
