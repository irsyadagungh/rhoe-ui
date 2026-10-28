"use client";

import { Check, FileCode2, PackageCheck, Sparkles } from "lucide-react";
import { BottomSheet } from "@/registry/components/bottom-sheet/bottom-sheet";
import { Button } from "@/registry/components/button/button";
import { PreviewCanvas } from "../preview-canvas";

const changes = [
  { icon: PackageCheck, title: "App Drawer", detail: "Full-height side panel and updated motion." },
  { icon: Sparkles, title: "Date Range Picker", detail: "Sequential range highlight animation." },
  { icon: FileCode2, title: "Bottom Sheet", detail: "Responsive width for larger screens." },
];

export function BottomSheetSandbox() {
  return (
    <PreviewCanvas showReplay={false}>
      <div className="flex min-h-[24rem] w-full items-center justify-center p-8">
        <BottomSheet
          trigger={<Button>Review changes</Button>}
          title="Publish changes?"
          description="Three component updates will become available in the Free registry."
        >
          {({ close }) => (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["3", "Components"],
                  ["8", "Files"],
                  ["Free", "Release"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-[var(--surface-muted)] px-3 py-4 text-center">
                    <strong className="block text-lg leading-none">{value}</strong>
                    <span className="mt-1.5 block text-xs text-[var(--text-secondary)]">{label}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  Included changes
                </p>
                <div className="space-y-1">
                  {changes.map(({ icon: Icon, title, detail }) => (
                    <div key={title} className="flex items-start gap-3 rounded-2xl px-2 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm">{title}</strong>
                        <span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{detail}</span>
                      </span>
                      <Check className="mt-2 size-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>

              <p className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                Publishing updates the public registry immediately. Existing installations remain unchanged until users reinstall a component.
              </p>

              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Button className="w-full" variant="bordered" onClick={close}>Keep editing</Button>
                <Button className="w-full" onClick={close}>Publish changes</Button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </PreviewCanvas>
  );
}
