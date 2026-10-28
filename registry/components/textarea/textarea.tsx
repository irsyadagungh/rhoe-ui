"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "../button/button";
import "../foundation.css";

export type TextareaVariant = "filled" | "bordered";
export type TextareaResize = "none" | "vertical" | "both";

interface CharacterItem {
  id: number;
  value: string;
  isNew: boolean;
  delay: number;
}

export interface TextareaProps extends Omit<
  ComponentPropsWithoutRef<"textarea">,
  "value" | "defaultValue"
> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  suffixControl?: ReactNode;
  variant?: TextareaVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  clearable?: boolean;
  clearLabel?: string;
  /** Duration, in milliseconds, of the typed-character reveal. */
  animationDuration?: number;
  /** Expands the field to fit its current content. */
  autoResize?: boolean;
  /** Native resize behavior when autoResize is disabled. */
  resize?: TextareaResize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  id,
  label,
  hint,
  error,
  prefixIcon,
  suffixIcon,
  suffixControl,
  variant = "filled",
  value,
  defaultValue = "",
  onValueChange,
  clearable = true,
  clearLabel = "Clear text",
  animationDuration,
  autoResize = false,
  resize = "vertical",
  disabled,
  required,
  className,
  style,
  rows = 4,
  onChange,
  "aria-describedby": ariaDescribedBy,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [caretOffset, setCaretOffset] = useState(0);
  const [visualScrollTop, setVisualScrollTop] = useState(0);
  const currentValue = value ?? internalValue;
  const [characterState, setCharacterState] = useState<{
    value: string;
    items: CharacterItem[];
    nextId: number;
  }>(() => ({
    value: currentValue,
    items: Array.from(currentValue).map((character, index) => ({
      id: index,
      value: character,
      isNew: false,
      delay: 0,
    })),
    nextId: currentValue.length,
  }));
  const describedBy = [ariaDescribedBy, error ? errorId : hint ? hintId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  const appearanceClass = error
    ? "border-[var(--danger-surface-foreground)] bg-[color-mix(in_srgb,var(--danger-surface)_36%,var(--surface))] focus-within:border-[var(--danger-surface-foreground)]"
    : variant === "filled"
      ? "border-transparent bg-[var(--surface-muted)] focus-within:border-[var(--focus)]"
      : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_58%,var(--surface))] focus-within:border-[var(--focus)]";

  if (characterState.value !== currentValue) {
    const previousItems = characterState.items;
    const previousCharacters = previousItems.map((item) => item.value);
    const nextCharacters = Array.from(currentValue);
    const sequenceLengths = Array.from(
      { length: previousCharacters.length + 1 },
      () => Array<number>(nextCharacters.length + 1).fill(0),
    );

    for (let previousIndex = previousCharacters.length - 1; previousIndex >= 0; previousIndex -= 1) {
      for (let nextIndex = nextCharacters.length - 1; nextIndex >= 0; nextIndex -= 1) {
        sequenceLengths[previousIndex][nextIndex] = previousCharacters[previousIndex] === nextCharacters[nextIndex]
          ? (sequenceLengths[previousIndex + 1][nextIndex + 1] ?? 0) + 1
          : Math.max(
              sequenceLengths[previousIndex + 1][nextIndex] ?? 0,
              sequenceLengths[previousIndex][nextIndex + 1] ?? 0,
            );
      }
    }

    const items: CharacterItem[] = [];
    let nextId = characterState.nextId;
    let previousIndex = 0;
    let nextIndex = 0;
    let insertionIndex = 0;

    while (nextIndex < nextCharacters.length) {
      if (
        previousIndex < previousCharacters.length &&
        previousCharacters[previousIndex] === nextCharacters[nextIndex]
      ) {
        items.push({ ...previousItems[previousIndex], isNew: false, delay: 0 });
        previousIndex += 1;
        nextIndex += 1;
      } else if (
        previousIndex < previousCharacters.length &&
        (sequenceLengths[previousIndex + 1][nextIndex] ?? 0) >=
          (sequenceLengths[previousIndex][nextIndex + 1] ?? 0)
      ) {
        previousIndex += 1;
      } else {
        items.push({
          id: nextId,
          value: nextCharacters[nextIndex],
          isNew: true,
          delay: insertionIndex * 25,
        });
        nextId += 1;
        nextIndex += 1;
        insertionIndex += 1;
      }
    }

    setCharacterState({ value: currentValue, items, nextId });
  }

  const resizeToContent = useCallback(() => {
    const element = textareaRef.current;
    if (!autoResize || !element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [autoResize]);

  const syncCaretOffset = useCallback(() => {
    const element = textareaRef.current;
    if (!element || typeof window === "undefined") return;

    const computed = window.getComputedStyle(element);
    const mirror = document.createElement("div");
    const marker = document.createElement("span");
    const copiedStyles = [
      "boxSizing",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "letterSpacing",
      "lineHeight",
      "textTransform",
      "textIndent",
      "wordSpacing",
      "tabSize",
    ] as const;

    for (const property of copiedStyles) {
      mirror.style[property] = computed[property];
    }

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.top = "0";
    mirror.style.left = "-9999px";
    mirror.style.width = `${element.clientWidth}px`;
    mirror.style.padding = "0";
    mirror.style.border = "0";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";
    mirror.style.wordBreak = "break-word";
    mirror.textContent = element.value.slice(0, element.selectionStart ?? 0);
    marker.textContent = "\u200b";
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const markerTop = marker.getBoundingClientRect().top - mirror.getBoundingClientRect().top;
    const lineHeight = Number.parseFloat(computed.lineHeight) || 21;
    setCaretOffset(Math.max(0, element.offsetTop + markerTop - element.scrollTop - (40 - lineHeight) / 2));
    mirror.remove();
  }, []);

  useImperativeHandle(forwardedRef, () => textareaRef.current as HTMLTextAreaElement);

  useLayoutEffect(() => {
    resizeToContent();
    syncCaretOffset();
  }, [currentValue, resizeToContent, syncCaretOffset]);

  const updateValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const clear = () => {
    updateValue("");
    textareaRef.current?.focus();
    requestAnimationFrame(syncCaretOffset);
  };

  const settleCharacter = (characterId: number) => {
    setCharacterState((currentState) => {
      const item = currentState.items.find((character) => character.id === characterId);
      if (!item?.isNew) return currentState;

      return {
        ...currentState,
        items: currentState.items.map((character) =>
          character.id === characterId
            ? { ...character, isNew: false, delay: 0 }
            : character,
        ),
      };
    });
  };

  const hasValue = currentValue.length > 0;
  const hasAnimatingCharacters = characterState.items.some((item) => item.isNew);

  return (
    <div className={["grid w-full gap-2", className].filter(Boolean).join(" ")}>
      {label ? <label className="text-[13px] leading-[1.4] font-[620] text-[var(--text)]" htmlFor={textareaId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label> : null}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_40px] items-start gap-1">
        <div
          className={[
            "relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-[18px] border text-[var(--text)] transition-[background-color,border-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:duration-[0.01ms]",
            "p-3.5",
            appearanceClass,
            disabled && "cursor-not-allowed opacity-[0.52]",
          ].filter(Boolean).join(" ")}
          style={animationDuration
            ? ({ "--textarea-character-duration": `${animationDuration}ms` } as CSSProperties)
            : undefined}
        >
          {prefixIcon ? <span className="grid shrink-0 place-items-center pt-0.5 text-[var(--text-secondary)] [&>svg]:size-[18px]" aria-hidden="true">{prefixIcon}</span> : null}
          <div className="relative min-h-[24px] min-w-0 overflow-hidden">
            <div
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 z-[1] overflow-hidden whitespace-pre-wrap break-words text-[14px] leading-[1.5] tracking-[-0.01em] text-[var(--text)] [font-feature-settings:'kern'_0,'liga'_0,'clig'_0] [font-kerning:none] [font-variant-ligatures:none] select-none"
              aria-hidden="true"
            >
              <span className="block will-change-transform" style={{ transform: `translateY(${-visualScrollTop}px)` }}>
                {hasAnimatingCharacters
                  ? characterState.items.map((item) => (
                      <span
                        className={item.isNew ? "inline-block animate-[rhoe-input-character-reveal_var(--textarea-character-duration,600ms)_cubic-bezier(0.16,1,0.3,1)_both] will-change-[transform,opacity] motion-reduce:inline motion-reduce:animate-none motion-reduce:transform-none motion-reduce:will-change-auto" : undefined}
                        key={item.id}
                        onAnimationEnd={() => settleCharacter(item.id)}
                        style={{ animationDelay: item.delay ? `${item.delay}ms` : undefined }}
                      >
                        {item.value === " " ? "\u00a0" : item.value}
                      </span>
                    ))
                  : characterState.items.map((item) => item.value).join("")}
              </span>
            </div>
            <textarea
              {...props}
              ref={textareaRef}
              id={textareaId}
              className={[
                "relative z-[2] min-h-[24px] w-full min-w-0 border-0 bg-transparent p-0 text-[14px] leading-[1.5] tracking-[-0.01em] text-[var(--text)] caret-[var(--focus)] outline-none placeholder:text-[var(--text-secondary)] placeholder:opacity-100 [font-feature-settings:'kern'_0,'liga'_0,'clig'_0] [font-kerning:none] [font-variant-ligatures:none] disabled:cursor-not-allowed",
                hasValue && "!text-transparent ![-webkit-text-fill-color:transparent] ![text-shadow:none]",
                autoResize ? "resize-none overflow-hidden" : resize === "both" ? "resize" : resize === "vertical" ? "resize-y" : "resize-none",
              ].filter(Boolean).join(" ")}
              style={hasValue ? {
                ...style,
                color: "transparent",
                WebkitTextFillColor: "transparent",
              } : style}
              value={currentValue}
              rows={rows}
              disabled={disabled}
              required={required}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={describedBy}
              onChange={(event) => {
                updateValue(event.currentTarget.value);
                onChange?.(event);
                requestAnimationFrame(() => {
                  resizeToContent();
                  syncCaretOffset();
                });
              }}
              onSelect={(event) => {
                props.onSelect?.(event);
                requestAnimationFrame(syncCaretOffset);
              }}
              onKeyUp={(event) => {
                props.onKeyUp?.(event);
                requestAnimationFrame(syncCaretOffset);
              }}
              onClick={(event) => {
                props.onClick?.(event);
                requestAnimationFrame(syncCaretOffset);
              }}
              onFocus={(event) => {
                props.onFocus?.(event);
                requestAnimationFrame(syncCaretOffset);
              }}
              onScroll={(event) => {
                setVisualScrollTop(event.currentTarget.scrollTop);
                props.onScroll?.(event);
                requestAnimationFrame(syncCaretOffset);
              }}
            />
          </div>
          <span className="inline-flex min-w-0 items-center gap-2 pt-0.5">
            {suffixIcon ? <span className="grid shrink-0 place-items-center text-[var(--text-secondary)] [&>svg]:size-[18px]" aria-hidden="true">{suffixIcon}</span> : null}
            {suffixControl ? <span className="inline-flex shrink-0 items-center">{suffixControl}</span> : null}
          </span>
        </div>
        {clearable && hasValue && !disabled ? (
          <Button
            className="size-10 p-0 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
            style={{ transform: `translateY(${caretOffset}px)` }}
            variant="text"
            tone="secondary"
            size="small"
            icon={<X />}
            aria-label={clearLabel}
            onClick={clear}
          />
        ) : <span aria-hidden="true" />}
      </div>
      {error || hint || typeof props.maxLength === "number" ? (
        <div className="-mt-0.5 flex min-w-0 items-start justify-between gap-3">
          {error ? <p className="m-0 min-w-0 text-xs leading-[1.5] text-[var(--danger-surface-foreground)]" id={errorId}>{error}</p> : hint ? <p className="m-0 min-w-0 text-xs leading-[1.5] text-[var(--text-secondary)]" id={hintId}>{hint}</p> : <span />}
          {typeof props.maxLength === "number" ? (
            <p className="m-0 shrink-0 text-right text-xs leading-[1.5] text-[var(--text-secondary)]" aria-live="polite">
              {currentValue.length} / {props.maxLength}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
