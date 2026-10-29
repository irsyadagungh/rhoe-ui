"use client";

import {
  forwardRef,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Button, type ButtonSize } from "../button/button";
import "../foundation.css";

export type InputVariant = "filled" | "bordered";
export type InputType = "text" | "email" | "password" | "search" | "tel" | "url";
export type InputSize = ButtonSize;

interface CharacterItem {
  id: number;
  value: string;
  isNew: boolean;
  delay: number;
}

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "prefix" | "size" | "type" | "value" | "defaultValue"> {
  label?: string;
  hint?: string;
  error?: ReactNode;
  placeholder?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  suffixControl?: ReactNode;
  variant?: InputVariant;
  size?: InputSize;
  dense?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  clearLabel?: string;
  maskCharacter?: string;
  animationDuration?: number;
  valueFeedbackKey?: number;
  valueDisplay?: ReactNode;
  /** Allows valueDisplay to contain interactive controls such as removable chips. */
  valueDisplayInteractive?: boolean;
  /** Handles clicks inside an interactive value display. */
  onValueDisplayClick?: MouseEventHandler<HTMLDivElement>;
  clearable?: boolean;
  externalTrailing?: ReactNode;
  externalTrailingClassName?: string;
  type?: InputType;
  showPasswordToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  expanded?: boolean;
  expandedContent?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  id,
  label,
  hint,
  error,
  placeholder,
  prefixIcon,
  suffixIcon,
  suffixControl,
  variant = "filled",
  size = "medium",
  dense = false,
  value,
  defaultValue = "",
  disabled,
  required,
  className,
  style,
  onChange,
  onScroll,
  onValueChange,
  clearLabel = "Clear input",
  maskCharacter = "•",
  animationDuration,
  valueFeedbackKey = 0,
  valueDisplay,
  valueDisplayInteractive = false,
  onValueDisplayClick,
  clearable = true,
  externalTrailing,
  externalTrailingClassName,
  type = "text",
  showPasswordToggle = false,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  expanded = false,
  expandedContent,
  "aria-describedby": ariaDescribedBy,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [passwordVisible, setPasswordVisible] = useState(false);
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
  const hasValue = currentValue.length > 0;
  const controlSize = dense ? "small" : size;
  const controlHeightClass = {
    small: "min-h-10",
    medium: "min-h-[46px]",
    large: "min-h-[52px]",
  }[controlSize];
  const contentHeightClass = {
    small: "min-h-[38px]",
    medium: "min-h-[44px]",
    large: "min-h-[50px]",
  }[controlSize];
  const appearanceClass = error
    ? "border-[var(--danger-surface-foreground)] bg-[color-mix(in_srgb,var(--danger-surface)_36%,var(--surface))] focus-within:border-[var(--danger-surface-foreground)]"
    : variant === "filled"
      ? "border-transparent bg-[var(--surface-muted)] focus-within:border-[var(--focus)]"
      : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_58%,var(--surface))] focus-within:border-[var(--focus)]";
  const isPassword = type === "password";
  const resolvedType = isPassword && passwordVisible ? "text" : type;

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

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const updateValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const clear = () => {
    updateValue("");
    inputRef.current?.focus();
  };

  const syncVisualScroll = () => {
    if (overlayRef.current && inputRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  useLayoutEffect(() => {
    syncVisualScroll();
  }, [currentValue]);

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

  const displayCharacter = (character: string) =>
    isPassword && !passwordVisible ? maskCharacter : character === " " ? "\u00a0" : character;
  const hasAnimatingCharacters = characterState.items.some((item) => item.isNew);

  return (
    <div className={["relative grid w-full gap-2", expanded && "z-[120]", className].filter(Boolean).join(" ")}>
      {label ? <label className="text-[13px] leading-[1.4] font-[620] text-[var(--text)]" htmlFor={inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label> : null}
      <div className={[
        "relative min-w-0",
        expandedContent && controlHeightClass,
        externalTrailing && "grid min-w-0 grid-cols-[minmax(0,1fr)_var(--input-external-width,auto)] items-end gap-[var(--input-external-gap,4px)] transition-[grid-template-columns,gap] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
      ].filter(Boolean).join(" ")}>
        <div
          className={[
            "flex flex-col items-start overflow-hidden rounded-[18px] border text-[var(--text)] transition-[background-color,border-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:duration-[0.01ms]",
            expandedContent ? "absolute inset-x-0 top-0 w-full" : "relative",
            controlHeightClass,
            appearanceClass,
            disabled && "cursor-not-allowed opacity-[0.52]",
            expanded ? "z-[120] !border-transparent focus-within:!border-transparent" : "z-0",
          ].filter(Boolean).join(" ")}
          style={animationDuration
            ? ({ "--input-character-duration": `${animationDuration}ms` } as CSSProperties)
            : undefined}
        >
        <div className={[
          "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:'prefix_input_trailing'] items-center gap-2 px-3.5",
          contentHeightClass,
        ].filter(Boolean).join(" ")}>
          {prefixIcon ? <span className="[grid-area:prefix] grid shrink-0 place-items-center text-[var(--text-secondary)] [&>svg]:size-[18px]" aria-hidden="true">{prefixIcon}</span> : null}
          <div className={[
            "relative [grid-area:input] flex min-w-0 flex-1 items-center overflow-hidden",
            contentHeightClass,
          ].filter(Boolean).join(" ")}>
          <div
            ref={overlayRef}
            className={[
              "absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-[14px] leading-[1.5] tracking-[-0.01em] text-[var(--text)] [font-feature-settings:'kern'_0,'liga'_0,'clig'_0] [font-kerning:none] [font-variant-ligatures:none] select-none",
              valueDisplayInteractive ? "z-[2] pointer-events-auto" : "pointer-events-none",
              valueFeedbackKey > 0 && "animate-[rhoe-input-value-error-feedback_200ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-[rhoe-input-value-error-feedback-reduced_160ms_ease-out]",
            ].filter(Boolean).join(" ")}
            key={valueFeedbackKey}
            aria-hidden={valueDisplayInteractive ? undefined : true}
            onClick={valueDisplayInteractive ? onValueDisplayClick : undefined}
          >
            <span data-input-value>
              {valueDisplay ?? (hasAnimatingCharacters
                ? characterState.items.map((item) => (
                    <span
                      className={item.isNew ? "inline-block animate-[rhoe-input-character-reveal_var(--input-character-duration,600ms)_cubic-bezier(0.16,1,0.3,1)_both] will-change-[transform,opacity] motion-reduce:inline motion-reduce:animate-none motion-reduce:transform-none motion-reduce:will-change-auto" : undefined}
                      key={item.id}
                      onAnimationEnd={() => settleCharacter(item.id)}
                      style={{ animationDelay: item.delay ? `${item.delay}ms` : undefined }}
                    >
                      {displayCharacter(item.value)}
                    </span>
                  ))
                : characterState.items.map((item) => displayCharacter(item.value)).join(""))}
            </span>
          </div>
          <input
            {...props}
            ref={inputRef}
            id={inputId}
            className={[
              "relative z-[1] h-full [min-height:inherit] w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-[14px] leading-[1.5] tracking-[-0.01em] text-[var(--text)] caret-[var(--focus)] outline-none placeholder:text-[var(--text-secondary)] placeholder:opacity-100 [font-feature-settings:'kern'_0,'liga'_0,'clig'_0] [font-kerning:none] [font-variant-ligatures:none] disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              hasValue && "!text-transparent ![-webkit-text-fill-color:transparent] ![text-shadow:none]",
              isPassword && showPasswordToggle && "[&::-webkit-contacts-auto-fill-button]:pointer-events-none [&::-webkit-contacts-auto-fill-button]:invisible [&::-webkit-contacts-auto-fill-button]:absolute [&::-webkit-contacts-auto-fill-button]:right-0 [&::-webkit-credentials-auto-fill-button]:pointer-events-none [&::-webkit-credentials-auto-fill-button]:invisible [&::-webkit-credentials-auto-fill-button]:absolute [&::-webkit-credentials-auto-fill-button]:right-0",
            ].filter(Boolean).join(" ")}
            style={hasValue ? {
              ...style,
              color: "transparent",
              WebkitTextFillColor: "transparent",
            } : style}
            type={resolvedType}
            value={currentValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-placeholder={placeholder}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            onChange={(event) => {
              updateValue(event.currentTarget.value);
              onChange?.(event);
              requestAnimationFrame(syncVisualScroll);
            }}
            onScroll={(event) => {
              syncVisualScroll();
              onScroll?.(event);
            }}
            onKeyDown={(event) => {
              props.onKeyDown?.(event);
              requestAnimationFrame(syncVisualScroll);
            }}
            onKeyUp={(event) => {
              props.onKeyUp?.(event);
              requestAnimationFrame(syncVisualScroll);
            }}
            onClick={(event) => {
              props.onClick?.(event);
              requestAnimationFrame(syncVisualScroll);
            }}
          />
          </div>
          <span className="[grid-area:trailing] inline-flex min-w-0 items-center gap-2">
            {suffixIcon ? <span className="grid shrink-0 place-items-center text-[var(--text-secondary)] [&>svg]:size-[18px]" aria-hidden="true">{suffixIcon}</span> : null}
            {suffixControl ? <span className="inline-flex shrink-0 items-center">{suffixControl}</span> : null}
            {isPassword && showPasswordToggle && !disabled ? (
            <Button
              className="w-[30px] min-h-[30px] shrink-0 basis-[30px] p-0 [&_svg]:size-4"
              variant="text"
              tone="secondary"
              size="small"
              icon={passwordVisible ? <EyeOff /> : <Eye />}
              aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
              aria-pressed={passwordVisible}
              onClick={() => {
                setPasswordVisible((visible) => !visible);
                inputRef.current?.focus();
              }}
            />
            ) : null}
            {clearable && hasValue && !disabled ? (
            <Button
              className="w-[30px] min-h-[30px] shrink-0 basis-[30px] p-0 [&_svg]:size-4"
              variant="text"
              tone="secondary"
              size="small"
              icon={<X />}
              aria-label={clearLabel}
              onClick={clear}
            />
            ) : null}
          </span>
        </div>
        {expandedContent ? (
          <div className={["w-full min-h-0 shrink-0 basis-0 overflow-hidden transition-[flex-basis] duration-[var(--input-expanded-duration)] ease-[var(--input-expanded-ease)] motion-reduce:duration-[0.01ms]", expanded && "basis-[var(--input-expanded-height,300px)]"].filter(Boolean).join(" ")} aria-hidden={!expanded} inert={!expanded}>
            <div className="min-h-0">{expandedContent}</div>
          </div>
        ) : null}
        </div>
        {externalTrailing ? <div className={[
          "inline-flex min-w-0 items-center gap-1 overflow-hidden",
          controlSize === "small" && "h-10 min-h-10",
          controlSize === "medium" && "h-[46px] min-h-[46px]",
          controlSize === "large" && "h-[52px] min-h-[52px]",
          externalTrailingClassName,
        ].filter(Boolean).join(" ")}>{externalTrailing}</div> : null}
      </div>
      {error ? <p className="m-0 text-xs leading-[1.5] text-[var(--danger-surface-foreground)]" id={errorId}>{error}</p> : hint ? <p className="m-0 text-xs leading-[1.5] text-[var(--text-secondary)]" id={hintId}>{hint}</p> : null}
    </div>
  );
});
