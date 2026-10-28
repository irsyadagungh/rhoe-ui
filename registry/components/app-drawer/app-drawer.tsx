"use client";

import type { ReactNode } from "react";
import { OverlayPanel } from "../lib/overlay-panel";

export interface AppDrawerProps {
  trigger?: ReactNode;
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  title?: ReactNode;
  description?: ReactNode;
  ariaLabel?: string;
  side?: "left" | "right";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  blocking?: boolean;
  width?: number | string;
  className?: string;
}

export function AppDrawer({ side = "right", width, ...props }: AppDrawerProps) {
  return <OverlayPanel placement={side} size={width} {...props} />;
}
