"use client";

import type { ReactNode } from "react";
import { OverlayPanel } from "../lib/overlay-panel";

export interface BottomSheetProps {
  trigger?: ReactNode;
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  title?: ReactNode;
  description?: ReactNode;
  ariaLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  blocking?: boolean;
  dragToDismiss?: boolean;
  height?: number | string;
  className?: string;
}

export function BottomSheet({ dragToDismiss = true, height, ...props }: BottomSheetProps) {
  return <OverlayPanel placement="bottom" dragToDismiss={dragToDismiss} size={height} {...props} />;
}
