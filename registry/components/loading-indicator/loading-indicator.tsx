import { SPINNERS } from "./loading-dev/spinners";
import type { SpinnerName } from "./loading-dev/motion";
import type { SpinnerProps } from "./loading-dev/types";

/** Loading indicators adapted from loading-dev, MIT © 2026 Jakub Krehel.
 * See loading-dev/LICENSE.md for the complete license.
 */
export type LoadingIndicatorVariant = SpinnerName;
export interface LoadingIndicatorProps extends SpinnerProps {
  variant?: LoadingIndicatorVariant;
  label?: string;
  decorative?: boolean;
}

export function LoadingIndicator({ variant = "atom", label = "Loading", decorative = false, ...props }: LoadingIndicatorProps) {
  const Indicator = SPINNERS[variant];
  return <span role={decorative ? undefined : "status"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined} style={{ display: "inline-flex", verticalAlign: "middle" }}><Indicator {...props} /></span>;
}
