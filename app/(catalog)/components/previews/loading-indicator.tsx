import { LoadingIndicator } from "@/registry/components/loading-indicator/loading-indicator";
import { SPINNERS } from "@/registry/components/loading-indicator/loading-dev/spinners";
import type { LoadingIndicatorVariant } from "@/registry/components/loading-indicator/loading-indicator";

export function LoadingIndicatorExample() {
  return <div className="grid w-full grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">{(Object.keys(SPINNERS) as LoadingIndicatorVariant[]).map((variant) => <div key={variant} className="flex min-h-32 flex-col items-center justify-center gap-5 rounded-2xl bg-[var(--surface)] p-3"><LoadingIndicator variant={variant} size={32} decorative /><span className="text-center text-xs text-[var(--text-secondary)]">{variant}</span></div>)}</div>;
}
