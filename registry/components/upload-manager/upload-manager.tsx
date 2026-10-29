"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { createPortal, flushSync } from "react-dom";
import { Check, File, Upload, X } from "lucide-react";
import { Button } from "../button/button";
import { Modal } from "../modal/modal";
import { IconMorph } from "../icon-morph/icon-morph";
import { RollingNumber } from "../rolling-number/rolling-number";
import { Tooltip } from "../tooltip/tooltip";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export type UploadStatus = "pending" | "uploading" | "uploaded" | "error" | "canceled";
export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  /** Internal animation origin for the first file in a batch. */
  origin?: number;
}
export interface UploadRequest {
  file: File;
  signal: AbortSignal;
  onProgress: (percentage: number) => void;
}
interface UploadManagerCommonProps {
  /** Remove a file from storage before removing it from the list. */
  onRemove?: (item: UploadItem) => void | Promise<void>;
  /** Text shown in the uploaded file's remove tooltip. */
  removeTooltip?: string;
  /** Show the upload area inline or open it in an overlay. */
  mode?: "inline" | "overlay";
  /** Shape of the control that opens the upload overlay. */
  triggerVariant?: "button" | "panel";
  /** Allow opening a local file preview from the list. */
  previewEnabled?: boolean;
  /** Hint above the list; set to false to hide it. */
  previewHint?: string | false;
  accept?: string;
  multiple?: boolean;
  allowCancel?: boolean;
  overlayListHeight?: number;
  listHeight?: number;
  label?: string;
  className?: string;
}

export type UploadManagerProps = UploadManagerCommonProps & (
  | { uploadMode?: "direct"; onUpload: (request: UploadRequest) => Promise<void>; onFilesChange?: never }
  | { uploadMode: "local"; onUpload?: never; onFilesChange: (files: File[]) => void }
);

export function UploadManager({
  onUpload,
  onFilesChange,
  uploadMode = "direct",
  onRemove,
  removeTooltip = "Remove",
  mode = "inline",
  triggerVariant = "button",
  previewEnabled = true,
  previewHint = "Tap an item to see the preview",
  accept,
  multiple = true,
  allowCancel = true,
  overlayListHeight = 240,
  listHeight = 240,
  label = "Upload files",
  className,
}: UploadManagerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [removing, setRemoving] = useState<string[]>([]);
  const [activeRemove, setActiveRemove] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openingSurface, setOpeningSurface] = useState<DOMRect | null>(null);
  const [closingSurface, setClosingSurface] = useState<{ from: DOMRect; to: DOMRect } | null>(null);
  const [preview, setPreview] = useState<{ file: File; url: string; origin: DOMRect; trigger: HTMLElement } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewLayerRef = useRef<HTMLDivElement>(null);
  const [pageListTarget, setPageListTarget] = useState<HTMLDivElement | null>(
    null,
  );
  const [overlayListTarget, setOverlayListTarget] =
    useState<HTMLDivElement | null>(null);
  const [generation, setGeneration] = useState(0);
  const [animateNewDropzone, setAnimateNewDropzone] = useState(false);
  const [morphingItem, setMorphingItem] = useState<string | null>(null);
  const [reservedListHeight, setReservedListHeight] = useState(0);
  const [travel, setTravel] = useState<{
    from: DOMRect;
    to: { left: number; top: number; width: number };
    id: number;
  } | null>(null);
  const travelId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listOrigin = useRef<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropzoneRef = useRef<HTMLButtonElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const pendingFiles = useRef(new Map<string, File>());
  const nextId = useRef(0);
  const dragDepth = useRef(0);
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { ...motionTokens.spring.smooth };
  const heightTransition = reducedMotion
    ? { duration: 0 }
    : {
        duration: motionTokens.duration.expand,
        ease: motionTokens.ease.standard,
      };

  useLayoutEffect(() => {
    if (open || !travel || !pageListTarget) return;

    // Reserving the list's space can move a centered parent. Measure only
    // after that space participates in layout, before the animation paints.
    const destination = pageListTarget.getBoundingClientRect();
    if (
      destination.left === travel.to.left &&
      destination.top === travel.to.top &&
      destination.width === travel.to.width
    ) return;

    // The destination must be corrected synchronously before the first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTravel((current) => current?.id === travel.id ? {
      ...current,
      to: { left: destination.left, top: destination.top, width: destination.width },
    } : current);
  }, [open, pageListTarget, travel]);

  useEffect(() => {
    const pending = controllers.current;
    return () => {
      pending.forEach((controller) => controller.abort());
      pending.clear();
    };
  }, []);
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);
  useEffect(() => {
    if (!preview || !previewOpen) return;
    const layer = previewLayerRef.current;
    const siblings = Array.from(document.body.children).filter((node) => node !== layer && node instanceof HTMLElement) as HTMLElement[];
    const previous = siblings.map((node) => ({ node, inert: node.inert }));
    previous.forEach(({ node }) => { node.inert = true; });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => previewRef.current?.focus({ preventScroll: true }));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setPreviewOpen(false);
      } else if (event.key === "Tab" && previewRef.current) {
        const controls = Array.from(previewRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], video[controls], audio[controls], iframe, object[tabindex]'));
        if (!controls.length) { event.preventDefault(); return; }
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); controls[controls.length - 1].focus(); }
        else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKey, true); previous.forEach(({ node, inert }) => { node.inert = inert; }); document.body.style.overflow = previousOverflow; };
  }, [preview, previewOpen]);
  useEffect(() => {
    const node = listRef.current;
    if (!node || travel) return;
    const observer = new ResizeObserver(() => {
      setReservedListHeight(node.offsetHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, items.length, travel]);
  const update = useCallback(
    (id: string, patch: Partial<UploadItem>) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    [],
  );
  const addFiles = (files: FileList | File[]) => {
    const candidates = Array.from(files);
    if (!candidates.length) return;
    if (!multiple && items.length > 0) {
      setSelectionError("Remove the current file before choosing another.");
      return;
    }
    const rules =
      accept
        ?.split(",")
        .map((rule) => rule.trim().toLowerCase())
        .filter(Boolean) ?? [];
    const selection = candidates.filter(
      (file) =>
        !rules.length ||
        rules.some((rule) =>
          rule.startsWith(".")
            ? file.name.toLowerCase().endsWith(rule)
            : rule.endsWith("/*")
              ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
              : file.type.toLowerCase() === rule,
        ),
    );
    setSelectionError(
      selection.length < candidates.length
        ? "Some files do not match the accepted file types."
        : "",
    );
    if (!selection.length) return;
    const batch = (multiple ? selection : selection.slice(0, 1)).map(
      (file, index) => ({
        id: `${nextId.current++}`,
        file,
        status: uploadMode === "local" ? "pending" as const : "uploading" as const,
        progress: 0,
        origin: index === 0 ? generation : undefined,
      }),
    );
    setAnimateNewDropzone(true);
    setMorphingItem(reducedMotion ? null : batch[0].id);
    setGeneration((current) => current + 1);
    setItems((current) => [...batch, ...current]);
    setAnnouncement(`${batch.length} ${batch.length === 1 ? "file" : "files"} added${uploadMode === "local" ? ", pending upload" : ""}.`);
    if (uploadMode === "local") {
      batch.forEach(({ id, file }) => pendingFiles.current.set(id, file));
      onFilesChange?.(Array.from(pendingFiles.current.values()));
      return;
    }
    batch.forEach(({ id, file }) => {
      const controller = new AbortController();
      controllers.current.set(id, controller);
      Promise.resolve()
        .then(() =>
          controller.signal.aborted
            ? undefined
            : onUpload!({
                file,
                signal: controller.signal,
                onProgress: (percentage) => {
                  if (!controller.signal.aborted && Number.isFinite(percentage))
                    update(id, {
                      progress: Math.max(0, Math.min(100, percentage)),
                    });
                },
              }),
        )
        .then(() => {
          if (!controller.signal.aborted) {
            update(id, { status: "uploaded", progress: 100 });
            setAnnouncement(`${file.name} uploaded.`);
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            update(id, {
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed.",
            });
            setAnnouncement(`${file.name} failed: ${error instanceof Error ? error.message : "Upload failed."}`);
          }
        })
        .finally(() => controllers.current.delete(id));
    });
  };
  const cancel = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      controllers.current.delete(id);
      update(id, { status: "canceled" });
      const item = items.find((entry) => entry.id === id);
      if (item) setAnnouncement(`${item.file.name} canceled.`);
    },
    [items, update],
  );
  const remove = async (item: UploadItem) => {
    if (removing.includes(item.id)) return;
    setRemoving((current) => [...current, item.id]);
    try {
      if (item.status === "pending") {
        pendingFiles.current.delete(item.id);
        onFilesChange?.(Array.from(pendingFiles.current.values()));
      } else if (item.status === "uploaded") {
        await onRemove?.(item);
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSelectionError("");
      setAnnouncement(`${item.file.name} removed.`);
    } catch (error) {
      update(item.id, { error: error instanceof Error ? error.message : "Could not remove file." });
      setAnnouncement(`Could not remove ${item.file.name}: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setRemoving((current) => current.filter((id) => id !== item.id));
    }
  };
  const openPreview = (item: UploadItem, trigger: HTMLElement) => {
    const row = trigger.closest("li");
    if (!row) return;
    setPreview({ file: item.file, url: URL.createObjectURL(item.file), origin: row.getBoundingClientRect(), trigger });
    setPreviewOpen(true);
  };
  const drop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };
  const captureTrigger = (event: React.MouseEvent<HTMLElement>) => {
    if (!reducedMotion) setOpeningSurface(event.currentTarget.getBoundingClientRect());
  };
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        if (event.currentTarget.files) addFiles(event.currentTarget.files);
        event.currentTarget.value = "";
      }}
    />
  );
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setAnimateNewDropzone(false);
      setClosingSurface(null);
    }
    else setOpeningSurface(null);
    const from = listRef.current?.getBoundingClientRect() ?? null;
    if (!nextOpen && from && listRef.current) {
      // The first upload creates this space while the modal is open. Commit
      // its final height before measuring where the closing list should go.
      const height = listRef.current.offsetHeight;
      if (height !== reservedListHeight) {
        flushSync(() => setReservedListHeight(height));
      }
    }
    if (!nextOpen && !reducedMotion) {
      const source = dropzoneRef.current?.getBoundingClientRect();
      const destination = triggerRef.current?.getBoundingClientRect();
      if (source && destination) setClosingSurface({ from: source, to: destination });
    }
    listOrigin.current = from;
    if (!nextOpen && from && pageListTarget && !reducedMotion) {
      const destination = pageListTarget.getBoundingClientRect();
      setTravel({
        from,
        to: {
          left: destination.left,
          top: destination.top,
          width: destination.width,
        },
        id: travelId.current++,
      });
    } else if (!nextOpen) {
      setTravel(null);
    }
    setOpen(nextOpen);
  };
  const setOverlayTarget = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && listOrigin.current && !reducedMotion) {
        const panel = node.closest<HTMLElement>('[role="dialog"]');
        if (panel) {
          const width = Math.min(560, window.innerWidth - 32);
          const requestedHeight = Math.min(
            720,
            Math.max(430, overlayListHeight + 330),
          );
          const height = Math.min(requestedHeight, window.innerHeight - 32);
          const left = Math.max(16, (window.innerWidth - width) / 2);
          const top = Math.max(16, (window.innerHeight - height) / 2);
          setTravel({
            from: listOrigin.current,
            to: {
              left: left + 24,
              // The modal header is 32px high with a 16px margin; the drop
              // area is 160px high with a 12px gap before the list.
              top: top + 24 + 32 + 16 + 160 + 12,
              width: Math.max(0, width - 48),
            },
            id: travelId.current++,
          });
        }
        listOrigin.current = null;
      }
      setOverlayListTarget(node);
    },
    [overlayListHeight, reducedMotion],
  );
  const list = (height: number, inOverlay = false) => (
    <div className="relative min-w-0">
      <AnimatePresence initial={false}>
        {previewEnabled && previewHint && items.length > 0 && (
          <motion.p
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={heightTransition}
            className="m-0 overflow-hidden text-xs text-[var(--text-secondary)]"
          >
            {previewHint}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="relative">
      <ul
        aria-label="Files"
        className={`m-0 grid list-none gap-2 p-0 overscroll-contain ${inOverlay && morphingItem ? "overflow-visible" : "overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]"}`}
        style={{ maxHeight: inOverlay && morphingItem ? undefined : Math.max(80, height), paddingBlock: 12 }}
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              layout={inOverlay && item.origin === generation - 1 ? false : "position"}
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              initial={reducedMotion ? false : inOverlay && item.id === morphingItem
                ? { opacity: 1, height: 160, transform: "translateY(-24px)", backgroundColor: "var(--surface)" }
                : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transform: "translateY(0px)", backgroundColor: "var(--surface-muted)" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ height: heightTransition, opacity: heightTransition, transform: heightTransition, backgroundColor: heightTransition, layout: transition }}
              onAnimationComplete={() => setMorphingItem((current) => current === item.id ? null : current)}
              className="overflow-hidden rounded-[18px] bg-[var(--surface-muted)]"
            >
              <div className="px-4 py-3 text-[var(--text)]">
                <div className="flex items-center gap-3">
                  <button type="button" disabled={!previewEnabled} onClick={(event) => openPreview(item, event.currentTarget)} aria-label={`Preview ${item.file.name}, ${item.status}${item.error ? `, ${item.error}` : ""}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-[var(--focus)] disabled:cursor-default">
                  <File
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--text-secondary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-medium">
                      {item.file.name}
                    </p>
                    <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">
                      {item.status === "uploading"
                        ? <>Uploading · <RollingNumber value={Math.round(item.progress)} locale="en-US" />%</>
                        : item.status === "pending"
                          ? "Pending upload"
                        : item.status === "uploaded"
                          ? "Uploaded"
                          : item.status === "canceled"
                            ? "Canceled"
                            : "Failed"}
                      {item.error && <span className="text-[var(--danger-surface-foreground)]"> · {item.error}</span>}
                    </p>
                  </div>
                  </button>
                  {item.status === "uploading" && allowCancel ? (
                    <Button
                      type="button"
                      size="small"
                      variant="text"
                      icon={<X />}
                      aria-label={`Cancel upload of ${item.file.name}`}
                      onClick={() => cancel(item.id)}
                    />
                  ) : item.status !== "uploading" ? (
                    <Tooltip
                      type="button"
                      aria-label={`${removeTooltip} ${item.file.name}`}
                      content={removeTooltip}
                      side="top"
                      portal
                      size="small"
                      disabled={removing.includes(item.id)}
                      onFocus={() => setActiveRemove(item.id)}
                      onBlur={() => setActiveRemove(null)}
                      onClick={() => void remove(item)}
                      className={`!size-9 !border-transparent !bg-transparent [@media(hover:none)]:!text-[var(--danger-surface-foreground)] ${item.status === "error" || item.status === "canceled" || activeRemove === item.id || hoveredItem === item.id ? "!text-[var(--danger-surface-foreground)]" : "!text-[var(--success-surface-foreground)]"}`}
                      icon={item.status === "error" || item.status === "canceled" ? <X size={18} /> : <><span className="[@media(hover:none)]:hidden"><IconMorph state={activeRemove === item.id || hoveredItem === item.id} from={<Check />} to={<X />} size={18} paths={{ from: ["M5 13L10 18L10 18", "M10 18L19 7"], to: ["M6 6L12 12L18 18", "M18 6L6 18"] }} /></span><X size={18} className="hidden [@media(hover:none)]:block" /></>}
                    />
                  ) : null}
                </div>
                <AnimatePresence initial={false}>
                {item.status === "uploading" && (
                  <motion.div initial={false} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={heightTransition} className="overflow-hidden">
                  <progress
                    className="mt-3 block h-1 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-[var(--border)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--focus)] [&::-moz-progress-bar]:bg-[var(--focus)]"
                    value={item.progress}
                    max={100}
                    aria-label={`Upload progress for ${item.file.name}`}
                  />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-3 backdrop-blur-[2px] [mask-image:linear-gradient(black,transparent)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3 backdrop-blur-[2px] [mask-image:linear-gradient(transparent,black)]"
      />
      </div>
    </div>
  );
  const listTarget = travel
    ? document.body
    : open && overlayListTarget
      ? overlayListTarget
      : pageListTarget;
  const inOverlay = Boolean(open && overlayListTarget);
  return (
    <>
      <div
        className={["grid min-w-0 gap-1", className].filter(Boolean).join(" ")}
      >
        {mode === "inline" ? (
          <div
            onDragEnter={(event) => { event.preventDefault(); dragDepth.current++; setDragging(true); }}
            onDragLeave={(event) => { event.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); } }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={drop}
          >
            {fileInput}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`grid min-h-[160px] w-full place-items-center gap-2 rounded-[18px] border border-dashed p-6 text-center text-[var(--text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${dragging ? "border-[var(--focus)] bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
            >
              <span className="grid justify-items-center gap-2"><Upload size={24} aria-hidden="true" /><strong className="text-sm">Drop files here or choose files</strong><span className="text-xs text-[var(--text-secondary)]">{multiple ? "Select one or more files" : "Select one file"}</span></span>
            </button>
            {selectionError && <p role="alert" className="m-0 mt-2 text-sm text-[var(--danger-surface-foreground)]">{selectionError}</p>}
          </div>
        ) : <Modal
          open={open}
          onOpenChange={handleOpenChange}
          width={560}
          height={Math.min(720, Math.max(430, overlayListHeight + 330))}
          title="Upload files"
          contentOpenDelay={0}
          followTriggerOnClose
          hideTriggerGhost
          suspendFocusTrap={Boolean(preview)}
          className="!border-transparent !bg-transparent !shadow-none !overflow-visible"
          trigger={triggerVariant === "panel" ? (
            <button
              type="button"
              ref={triggerRef}
              onClick={captureTrigger}
              className="grid min-h-[112px] w-full place-content-center justify-items-center gap-2 rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            >
              <Upload size={20} aria-hidden="true" />
              {label}
            </button>
          ) : (
            <Button
              type="button"
              ref={triggerRef}
              onClick={captureTrigger}
              variant="bordered"
              icon={<Upload />}
              className="border-dashed"
            >
              {label}
            </Button>
          )}
        >
          <div
            className="grid w-[min(512px,calc(100vw-80px))] min-w-0 gap-3"
            onDragEnter={(event) => {
              event.preventDefault();
              dragDepth.current++;
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (--dragDepth.current <= 0) {
                dragDepth.current = 0;
                setDragging(false);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={drop}
          >
            {fileInput}
            <motion.div
              key={generation}
              style={{ visibility: (openingSurface && open) || (!open && closingSurface) ? "hidden" : undefined }}
              initial={
                reducedMotion || !animateNewDropzone
                  ? false
                  : { height: 0, opacity: 0 }
              }
              animate={{ height: "auto", opacity: 1 }}
              transition={{ height: heightTransition, opacity: heightTransition }}
              className="overflow-hidden"
            >
              <button
                type="button"
                ref={dropzoneRef}
                onClick={() => inputRef.current?.click()}
                className={`grid min-h-[160px] w-full place-items-center gap-2 rounded-[18px] border border-dashed p-6 text-center text-[var(--text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${dragging ? "border-[var(--focus)] bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
              >
                <span className="grid justify-items-center gap-2">
                  <Upload size={24} aria-hidden="true" />
                  <strong className="text-sm">
                    Drop files here or choose files
                  </strong>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {multiple ? "Select one or more files" : "Select one file"}
                  </span>
                </span>
              </button>
            </motion.div>
            <div
              ref={setOverlayTarget}
              style={{ minHeight: open && travel ? travel.from.height : undefined }}
            />
            {selectionError && (
              <p
                role="alert"
                className="m-0 text-sm text-[var(--danger-surface-foreground)]"
              >
                {selectionError}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>}
        {openingSurface && open && createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[232] grid place-items-center overflow-hidden rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text)]"
            initial={{ left: openingSurface.left, top: openingSurface.top, width: openingSurface.width, height: openingSurface.height }}
            animate={{
              left: Math.max(16, (window.innerWidth - Math.min(560, window.innerWidth - 32)) / 2) + 24,
              top: Math.max(16, (window.innerHeight - Math.min(Math.min(720, Math.max(430, overlayListHeight + 330)), window.innerHeight - 32)) / 2) + 24 + 32 + 16,
              width: Math.max(0, Math.min(560, window.innerWidth - 32) - 48),
              height: 160,
            }}
            transition={motionTokens.spring.morph}
            onAnimationComplete={() => setOpeningSurface(null)}
          >
            <span className="grid justify-items-center gap-2 whitespace-nowrap">
              <Upload size={24} aria-hidden="true" />
              <strong className="text-sm">Drop files here or choose files</strong>
              <span className="text-xs text-[var(--text-secondary)]">
                {multiple ? "Select one or more files" : "Select one file"}
              </span>
            </span>
          </motion.div>, document.body,
        )}
        {closingSurface && !open && createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[232] grid place-items-center overflow-hidden rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text)]"
            initial={{ left: closingSurface.from.left, top: closingSurface.from.top, width: closingSurface.from.width, height: closingSurface.from.height }}
            animate={{ left: closingSurface.to.left, top: closingSurface.to.top, width: closingSurface.to.width, height: closingSurface.to.height }}
            transition={motionTokens.spring.morph}
            onAnimationComplete={() => setClosingSurface(null)}
          >
            <span className={`flex items-center gap-2 whitespace-nowrap ${triggerVariant === "panel" ? "flex-col" : "flex-row"}`}><Upload size={20} aria-hidden="true" />{label}</span>
          </motion.div>, document.body,
        )}
        {preview && createPortal(
          <div ref={previewLayerRef}>
            <motion.div aria-hidden="true" className="fixed inset-0 z-[270] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: previewOpen ? 1 : 0 }} transition={heightTransition} />
            <motion.div
              ref={previewRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Preview ${preview.file.name}`}
              tabIndex={-1}
              className="fixed z-[271] flex flex-col overflow-hidden bg-[var(--surface)] text-[var(--text)] outline-none"
              initial={reducedMotion ? false : { left: preview.origin.left, top: preview.origin.top, width: preview.origin.width, height: preview.origin.height, borderRadius: 18 }}
              animate={previewOpen ? { left: 0, top: 0, width: "100vw", height: "100dvh", borderRadius: 0 } : { left: preview.origin.left, top: preview.origin.top, width: preview.origin.width, height: preview.origin.height, borderRadius: 18 }}
              transition={reducedMotion ? { duration: 0 } : motionTokens.spring.smooth}
              onAnimationComplete={() => {
                if (!previewOpen) {
                  const trigger = preview.trigger;
                  setPreview(null);
                  requestAnimationFrame(() => trigger.isConnected && trigger.focus({ preventScroll: true }));
                }
              }}
            >
              <motion.div className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: previewOpen ? 1 : 0 }} transition={{ duration: motionTokens.duration.fast }}>
                <header className="flex shrink-0 items-center gap-4 px-5 py-4">
                  <span className="min-w-0 flex-1 truncate font-medium">{preview.file.name}</span>
                  {preview.file.type === "application/pdf" && <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Open PDF in new tab</a>}
                  <Button type="button" variant="text" icon={<X />} aria-label="Close preview" onClick={() => setPreviewOpen(false)} />
                </header>
                <div className="flex min-h-0 flex-1 items-center justify-center p-4">
                  {preview.file.type.startsWith("image/") ? (
                    // Local object URLs are not served by the Next.js image optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.url} alt={preview.file.name} className="max-h-full max-w-full object-contain" />
                  ) : preview.file.type.startsWith("video/") ? (
                    <video src={preview.url} controls className="max-h-full max-w-full" />
                  ) : preview.file.type.startsWith("audio/") ? (
                    <audio src={preview.url} controls />
                  ) : preview.file.type === "application/pdf" ? (
                    <object data={preview.url} type="application/pdf" aria-label={`Preview ${preview.file.name}`} tabIndex={0} className="h-full w-full">
                      <div className="grid justify-items-center gap-3 text-center"><p>PDF preview is not available in this browser.</p><a href={preview.url} download={preview.file.name} className="underline">Download file</a></div>
                    </object>
                  ) : preview.file.type.startsWith("text/") ? (
                    <iframe title={`Preview ${preview.file.name}`} src={preview.url} sandbox="" className="h-full w-full border-0" />
                  ) : (
                    <div className="grid justify-items-center gap-3 text-center"><p>Preview is not available for this file type.</p><a href={preview.url} download={preview.file.name} className="underline">Download file</a></div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>, document.body,
        )}
        <div
          ref={setPageListTarget}
          inert={inOverlay}
          aria-hidden={inOverlay || undefined}
          style={{ minHeight: (open || travel) && items.length ? reservedListHeight : undefined }}
        />
        {items.length > 0 &&
          listTarget &&
          createPortal(
            <motion.div
              key={travel ? `travel-${travel.id}` : "settled"}
              ref={listRef}
              inert={travel ? true : undefined}
              aria-hidden={travel ? true : undefined}
              style={
                travel
                  ? {
                      position: "fixed",
                      zIndex: 232,
                      left: travel.from.left,
                      top: travel.from.top,
                      width: travel.from.width,
                      pointerEvents: "none",
                    }
                  : undefined
              }
              initial={
                travel
                  ? {
                      transform: "translate(0px, 0px)",
                      width: travel.from.width,
                    }
                  : false
              }
              animate={
                travel
                  ? {
                      transform: `translate(${travel.to.left - travel.from.left}px, ${travel.to.top - travel.from.top}px)`,
                      width: travel.to.width,
                    }
                  : { transform: "translate(0px, 0px)" }
              }
              transition={
                reducedMotion ? { duration: 0 } : motionTokens.spring.morph
              }
              onAnimationComplete={() => {
                if (travel)
                  setTravel((current) =>
                    current?.id === travel.id ? null : current,
                  );
              }}
            >
              {list(inOverlay ? overlayListHeight : listHeight, inOverlay)}
            </motion.div>,
            listTarget,
          )}
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    </>
  );
}
