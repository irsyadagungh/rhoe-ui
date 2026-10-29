"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useIsPresent,
  type Easing,
  type Variants,
} from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../button/button";
import { Input, type InputSize, type InputVariant } from "../input/input";
import { motionTokens } from "../lib/motion-tokens";

export interface DynamicListInputProps {
  label: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  variant?: InputVariant;
  actionPlacement?: "inside" | "outside";
  size?: InputSize;
  className?: string;
}

export function DynamicListInput({
  label,
  value,
  defaultValue = [],
  onValueChange,
  placeholder = "Item",
  hint,
  disabled = false,
  variant = "filled",
  actionPlacement = "outside",
  size = "medium",
  className,
}: DynamicListInputProps) {
  const id = useId();
  const filterId = `liquid-${id.replaceAll(":", "")}`;
  const hintId = `${id}-hint`;
  const draftRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState("");
  const values = value ?? internal;
  const [keys, setKeys] = useState(() =>
    values.map((_, index) => `initial-${index}`),
  );
  const nextKey = useRef(0);
  const [joining, setJoining] = useState<{
    key: string;
    next: string;
    kind: "add" | "remove";
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const startJoining = (key: string, next: string, kind: "add" | "remove") => {
    if (timer.current) clearTimeout(timer.current);
    setJoining({ key, next, kind });
    timer.current = setTimeout(
      () => setJoining(null),
      reducedMotion ? 0 : motionTokens.duration.expand * 1000,
    );
  };
  const rowKeys = values.map((_, index) => keys[index] ?? `external-${index}`);
  const rowHeight = { small: 40, medium: 46, large: 52 }[size];
  const duration = reducedMotion ? 0 : motionTokens.duration.expand;
  const rowTransition = {
    duration,
    ease: motionTokens.ease.standard,
  };
  const addTransition = { ...rowTransition, times: [0, 0.6, 0.64, 1] };
  const removeTransition = {
    ...rowTransition,
    ease: ["linear", motionTokens.ease.standard] as Easing[],
    times: [0, 0.3, 1],
  };
  const rowVariants = {
    initial: { height: 0, marginBottom: 0 },
    animate: {
      height: [0, rowHeight, rowHeight, rowHeight],
      marginBottom: [0, 0, 0, 8],
      transition: addTransition,
    },
    exit: {
      height: [rowHeight, rowHeight * 0.96, 0],
      marginBottom: [8, 0, 0],
      transition: removeTransition,
    },
  };
  const surface =
    variant === "filled"
      ? "var(--surface-muted)"
      : "color-mix(in srgb, var(--surface-muted) 58%, var(--surface))";
  const actionProps = (control: ReactNode) =>
    actionPlacement === "outside"
      ? { externalTrailing: control }
      : { suffixControl: control };
  const inputClass = [
    "[&>div>div:first-child]:!bg-transparent",
    variant === "bordered"
      ? "[&>div>div:first-child]:!border-[var(--border)]"
      : "[&>div>div:first-child]:!border-transparent",
    "[&>div>div:first-child:focus-within]:!border-[var(--focus)]",
  ].join(" ");
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const add = () => {
    const next = draft.trim();
    if (!next || disabled) return;
    const key = `added-${nextKey.current++}`;
    startJoining(key, "draft", "add");
    setKeys([...rowKeys, key]);
    update([...values, next]);
    setDraft("");
    setAnnouncement(`Added item ${values.length + 1}.`);
    draftRef.current?.focus();
  };

  return (
    <fieldset
      className={["grid min-w-0 gap-2 border-0 p-0 m-0", className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      aria-describedby={hint ? hintId : undefined}
    >
      <legend className="mb-2 text-[13px] leading-[1.4] font-[620] text-[var(--text)]">
        {label}
      </legend>
      <div className="relative min-w-0">
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="absolute pointer-events-none"
        >
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="3"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"
              />
            </filter>
          </defs>
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
          style={{
            right: actionPlacement === "outside" ? rowHeight + 4 : 0,
            filter: reducedMotion ? undefined : `url(#${filterId})`,
            opacity: disabled ? 0.52 : 1,
          }}
        >
          <AnimatePresence initial={false} custom={joining}>
            {values.map((_, index) => (
              <motion.div
                key={rowKeys[index]}
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="overflow-hidden"
              >
                <motion.div
                  initial={false}
                  custom={joining}
                  animate={{
                    borderRadius:
                      joining?.kind === "add" && joining.key === rowKeys[index]
                        ? [
                            "18px 18px 0px 0px",
                            "18px 18px 0px 0px",
                            "18px 18px 0px 0px",
                            "18px 18px 18px 18px",
                          ]
                        : joining?.next === rowKeys[index]
                          ? joining.kind === "add"
                            ? [
                                "0px 0px 18px 18px",
                                "0px 0px 18px 18px",
                                "0px 0px 18px 18px",
                                "18px 18px 18px 18px",
                              ]
                            : [
                                "18px 18px 18px 18px",
                                "0px 0px 18px 18px",
                                "18px 18px 18px 18px",
                              ]
                          : "18px 18px 18px 18px",
                    transition:
                      joining?.kind === "add"
                        ? addTransition
                        : joining?.kind === "remove"
                          ? removeTransition
                          : rowTransition,
                  }}
                  variants={{
                    exit: (operation: typeof joining) => ({
                      borderRadius:
                        operation?.key === rowKeys[index]
                          ? [
                              "18px 18px 18px 18px",
                              "18px 18px 0px 0px",
                              "18px 18px 0px 0px",
                            ]
                          : "18px 18px 18px 18px",
                      transition: removeTransition,
                    }),
                  }}
                  style={{
                    height: rowHeight,
                    background: surface,
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div
            initial={false}
            animate={{
              borderRadius:
                joining?.next === "draft"
                  ? joining.kind === "add"
                    ? [
                        "0px 0px 18px 18px",
                        "0px 0px 18px 18px",
                        "0px 0px 18px 18px",
                        "18px 18px 18px 18px",
                      ]
                    : [
                        "18px 18px 18px 18px",
                        "0px 0px 18px 18px",
                        "18px 18px 18px 18px",
                      ]
                  : "18px 18px 18px 18px",
              transition:
                joining?.kind === "add"
                  ? addTransition
                  : joining?.kind === "remove"
                    ? removeTransition
                    : rowTransition,
            }}
            style={{
              height: rowHeight,
              background: surface,
            }}
          />
        </div>
        <div className="relative">
          <AnimatePresence initial={false}>
            {values.map((item, index) => (
              <AccessibleRow key={rowKeys[index]} variants={rowVariants}>
                <motion.div
                  initial={{ opacity: reducedMotion ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: reducedMotion
                      ? 0
                      : motionTokens.duration.standard,
                  }}
                >
                  <Input
                    ref={(node) => {
                      if (node) inputRefs.current.set(rowKeys[index], node);
                      else inputRefs.current.delete(rowKeys[index]);
                    }}
                    className={inputClass}
                    aria-label={`${label}, item ${index + 1}`}
                    placeholder={`${placeholder} ${index + 1}`}
                    value={item}
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    clearable={false}
                    onValueChange={(next) =>
                      update(
                        values.map((entry, i) => (i === index ? next : entry)),
                      )
                    }
                    {...actionProps(
                      <Button
                        type="button"
                        variant={
                          actionPlacement === "outside" ? variant : "text"
                        }
                        tone="danger"
                        size={actionPlacement === "outside" ? size : "small"}
                        className={
                          actionPlacement === "outside"
                            ? "shrink-0 !p-0 rounded-[18px]"
                            : undefined
                        }
                        style={
                          actionPlacement === "outside"
                            ? { width: rowHeight, height: rowHeight }
                            : undefined
                        }
                        icon={<Trash2 />}
                        aria-label={`Remove ${label} item ${index + 1}`}
                        disabled={disabled}
                        onClick={() => {
                          const nextKey = rowKeys[index + 1];
                          (nextKey
                            ? inputRefs.current.get(nextKey)
                            : draftRef.current
                          )?.focus();
                          setAnnouncement(`Removed item ${index + 1}.`);
                          startJoining(
                            rowKeys[index],
                            rowKeys[index + 1] ?? "draft",
                            "remove",
                          );
                          setKeys(rowKeys.filter((_, i) => i !== index));
                          update(values.filter((_, i) => i !== index));
                        }}
                      />,
                    )}
                  />
                </motion.div>
              </AccessibleRow>
            ))}
          </AnimatePresence>
          <Input
            ref={draftRef}
            className={inputClass}
            aria-label={`${label}, item ${values.length + 1}`}
            placeholder={`${placeholder} ${values.length + 1}`}
            value={draft}
            variant={variant}
            size={size}
            disabled={disabled}
            clearable={false}
            onValueChange={setDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                add();
              }
            }}
            {...actionProps(
              <Button
                type="button"
                variant={actionPlacement === "outside" ? variant : "text"}
                size={actionPlacement === "outside" ? size : "small"}
                className={
                  actionPlacement === "outside"
                    ? "shrink-0 !p-0 rounded-[18px]"
                    : undefined
                }
                style={
                  actionPlacement === "outside"
                    ? { width: rowHeight, height: rowHeight }
                    : undefined
                }
                icon={<Plus />}
                aria-label={`Add ${label} item`}
                disabled={disabled || !draft.trim()}
                onClick={add}
              />,
            )}
          />
        </div>
      </div>
      {hint && (
        <p
          id={hintId}
          className="m-0 text-xs leading-[1.5] text-[var(--text-secondary)]"
        >
          {hint}
        </p>
      )}
      <span role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </fieldset>
  );
}

function AccessibleRow({
  children,
  variants,
}: {
  children: ReactNode;
  variants: Variants;
}) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
      inert={!isPresent}
      aria-hidden={!isPresent}
    >
      {children}
    </motion.div>
  );
}
