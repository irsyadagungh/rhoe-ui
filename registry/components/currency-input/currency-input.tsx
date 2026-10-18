"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "../button/button";
import { Input, type InputProps } from "../input/input";
import { MorphingText } from "../morphing-text/morphing-text";
import { TextReveal } from "../text-reveal/text-reveal";
import "../foundation.css";

type CurrencyDisplay = "symbol" | "narrowSymbol";

export interface CurrencyInputProps
  extends Omit<
    InputProps,
    "type" | "inputMode" | "value" | "defaultValue" | "onValueChange" | "prefixIcon" | "suffixIcon" | "suffixControl" | "max"
  > {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  currency?: string;
  defaultCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  currencies?: string[];
  locale?: string;
  currencyDisplay?: CurrencyDisplay;
  selectorLabel?: string;
  fractionDigits?: number;
  formatDelay?: number;
  limit?: number;
  limitError?: string;
}

const isoCurrencies = ["AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BRL","BSD","BTN","BWP","BYN","BZD","CAD","CDF","CHF","CLP","CNY","COP","CRC","CUC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLE","SLL","SOS","SRD","SSP","STN","SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","UYU","UZS","VES","VND","VUV","WST","XAF","XCD","XCG","XDR","XOF","XPF","XSU","YER","ZAR","ZMW","ZWG","ZWL"];
const zeroFractionCurrencies = new Set(["BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "PYG", "RWF", "UGX", "UYI", "VND", "VUV", "XAF", "XOF", "XPF"]);
const threeFractionCurrencies = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

function defaultFractionDigits(currency: string) {
  if (zeroFractionCurrencies.has(currency)) return 0;
  if (threeFractionCurrencies.has(currency)) return 3;
  if (currency === "CLF") return 4;
  return 2;
}

export function CurrencyInput({
  value,
  defaultValue = null,
  onValueChange,
  currency,
  defaultCurrency = "IDR",
  onCurrencyChange,
  currencies,
  locale,
  currencyDisplay = "narrowSymbol",
  selectorLabel = "Choose currency",
  fractionDigits: fractionDigitsProp,
  formatDelay = 700,
  limit = Number.MAX_SAFE_INTEGER,
  limitError,
  disabled,
  error: inputError,
  onFocus,
  onBlur,
  ...inputProps
}: CurrencyInputProps) {
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
  const [internalCurrency, setInternalCurrency] = useState(defaultCurrency);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [valueFeedbackKey, setValueFeedbackKey] = useState(0);
  const currentValue = value !== undefined ? value : internalValue;
  const limitValue = Number.isFinite(limit) && limit >= 0
    ? Math.min(limit, Number.MAX_SAFE_INTEGER)
    : Number.MAX_SAFE_INTEGER;
  const currentCurrency = (currency !== undefined ? currency : internalCurrency).toUpperCase();
  const resolvedLocale = locale ?? "en-US";
  const availableCurrencies = useMemo(
    () => Array.from(new Set(currencies?.length ? currencies.map((item) => item.toUpperCase()) : isoCurrencies)),
    [currencies],
  );
  const displayNames = useMemo(
    () => new Intl.DisplayNames([resolvedLocale], { type: "currency" }),
    [resolvedLocale],
  );
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(resolvedLocale, { style: "currency", currency: currentCurrency, currencyDisplay }),
    [currencyDisplay, currentCurrency, resolvedLocale],
  );
  const fractionDigits = fractionDigitsProp ?? defaultFractionDigits(currentCurrency);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(resolvedLocale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: true,
    }),
    [fractionDigits, resolvedLocale],
  );
  const editFormatter = useMemo(
    () => new Intl.NumberFormat(resolvedLocale, { maximumFractionDigits: fractionDigits, useGrouping: false }),
    [fractionDigits, resolvedLocale],
  );
  const integerFormatter = useMemo(
    () => new Intl.NumberFormat(resolvedLocale, { maximumFractionDigits: 0, useGrouping: true }),
    [resolvedLocale],
  );
  const decimalMark = editFormatter.formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
  const symbol = currencyFormatter.formatToParts(0).find((part) => part.type === "currency")?.value ?? currentCurrency;
  const formatValue = (nextValue: number | null, forEditing = false) =>
    nextValue === null ? "" : (forEditing ? editFormatter : numberFormatter).format(nextValue);
  const [editValue, setEditValue] = useState(() => formatValue(currentValue, true));
  const rootRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const formatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limitErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = `${useId()}-currencies`;

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => () => {
    if (formatTimerRef.current) clearTimeout(formatTimerRef.current);
    if (limitErrorTimerRef.current) clearTimeout(limitErrorTimerRef.current);
  }, []);

  const updateValue = (nextValue: number | null) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const sanitizeValue = (text: string) => {
    const escapedDecimal = decimalMark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isNegative = text.trimStart().startsWith("-");
    const numericText = text
      .replace(/-/g, "")
      .replace(new RegExp(`[^0-9${escapedDecimal}]`, "g"), "");
    const [integer = "", ...fractionParts] = numericText.split(decimalMark);
    const hasDecimal = numericText.includes(decimalMark);
    const fraction = fractionParts.join("").slice(0, fractionDigits);

    return `${isNegative ? "-" : ""}${integer}${hasDecimal && fractionDigits > 0 ? `${decimalMark}${fraction}` : ""}`;
  };

  const parseValue = (text: string) => {
    const escapedDecimal = decimalMark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalized = text
      .replace(new RegExp(`[^0-9${escapedDecimal}-]`, "g"), "")
      .replace(decimalMark, ".");
    if (!normalized || normalized === "-" || normalized === ".") return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatEditingValue = (text: string, parsedValue: number) => {
    const decimalIndex = text.indexOf(decimalMark);
    if (decimalIndex === -1) return integerFormatter.format(parsedValue);

    const integerText = text.slice(0, decimalIndex);
    const fractionText = text.slice(decimalIndex + decimalMark.length);
    const integerValue = Number(integerText || "0");
    const groupedInteger = integerFormatter.format(Number.isFinite(integerValue) ? integerValue : 0);

    return `${groupedInteger}${decimalMark}${fractionText}`;
  };

  const selectCurrency = (nextCurrency: string) => {
    if (currency === undefined) setInternalCurrency(nextCurrency);
    onCurrencyChange?.(nextCurrency);
    setOpen(false);
    setQuery("");
  };

  const filteredCurrencies = availableCurrencies.filter((code) => {
    const name = displayNames.of(code) ?? code;
    const search = query.trim().toLocaleLowerCase(resolvedLocale);
    return !search || code.toLowerCase().includes(search) || name.toLocaleLowerCase(resolvedLocale).includes(search);
  });

  return (
    <div ref={rootRef} className="group relative z-0 w-full data-[open]:z-[120]" data-open={open || undefined}>
      <Input
            {...inputProps}
            ref={amountRef}
            disabled={disabled}
            error={limitExceeded
              ? (
                  <TextReveal by="line" key={valueFeedbackKey}>
                    {limitError ?? `Amount limit is ${integerFormatter.format(limitValue)}.`}
                  </TextReveal>
                )
              : inputError}
            inputMode="decimal"
            type="text"
            value={editing ? editValue : formatValue(currentValue)}
            valueFeedbackKey={valueFeedbackKey}
            prefixIcon={<MorphingText value={symbol} />}
            suffixControl={
              <Button
                className="min-h-[34px] gap-[5px] rounded-[18px] px-2 pr-2 pl-2.5 text-xs tabular-nums [&_svg]:size-3.5 [&_svg]:transition-[rotate] [&_svg]:duration-[220ms] [&_svg]:ease-[var(--ease-standard)] motion-reduce:[&_svg]:duration-[0.01ms] group-data-[open]:[&_svg]:rotate-180"
                variant="text"
                tone="secondary"
                size="small"
                disabled={disabled}
                aria-label={`${selectorLabel}: ${currentCurrency}`}
                aria-expanded={open}
                aria-controls={listId}
                icon={<ChevronDown />}
                iconPosition="end"
                onClick={() => setOpen((current) => !current)}
              >
                <MorphingText value={currentCurrency} />
              </Button>
            }
            expanded={open}
            expandedContent={
              <div id={listId} className="grid h-[300px] grid-rows-[auto_minmax(0,1fr)] content-start gap-2.5 p-2.5 pb-3" {...(!open ? { inert: true } : {})}>
                <Input
                  ref={searchRef}
                  className="[&_input]:text-[13px]"
                  variant="bordered"
                  aria-label="Search currencies"
                  placeholder="Search by code or currency name"
                  prefixIcon={<Search />}
                  value={query}
                  onValueChange={setQuery}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                  }}
                />
                <ul className="m-0 grid min-h-0 content-start gap-0.5 overflow-y-auto overscroll-contain p-0 [scrollbar-width:thin]" aria-label={selectorLabel}>
                  {filteredCurrencies.length ? filteredCurrencies.map((code) => (
                    <li key={code}>
                      <Button
                        className="grid min-h-10 w-full grid-cols-[42px_minmax(0,1fr)_18px] justify-stretch gap-2.5 px-3 text-left [&>svg]:size-4 [&>svg]:text-[var(--success-surface-foreground)]"
                        variant="text"
                        tone="secondary"
                        size="small"
                        aria-current={code === currentCurrency ? "true" : undefined}
                        onClick={() => selectCurrency(code)}
                      >
                        <span className="font-[680] text-[var(--text)]">{code}</span>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-secondary)]" suppressHydrationWarning>{displayNames.of(code) ?? code}</span>
                        {code === currentCurrency ? <Check aria-hidden="true" /> : null}
                      </Button>
                    </li>
                  )) : (
                    <li className="grid min-h-full place-items-center p-5 text-center text-[13px] text-[var(--text-secondary)]" role="status">No currencies found.</li>
                  )}
                </ul>
              </div>
            }
            onValueChange={(text) => {
              const sanitizedValue = sanitizeValue(text);
              const parsedValue = parseValue(sanitizedValue);
              const selectionStart = amountRef.current?.selectionStart ?? text.length;
              const digitsAfterCaret = text.slice(selectionStart).replace(/\D/g, "").length;

              if (formatTimerRef.current) clearTimeout(formatTimerRef.current);
              if (parsedValue !== null && Math.abs(parsedValue) > limitValue) {
                if (limitErrorTimerRef.current) clearTimeout(limitErrorTimerRef.current);
                setLimitExceeded(true);
                setValueFeedbackKey((current) => current + 1);
                limitErrorTimerRef.current = setTimeout(() => {
                  setLimitExceeded(false);
                  limitErrorTimerRef.current = null;
                }, 3000);
                return;
              }

              if (limitErrorTimerRef.current) {
                clearTimeout(limitErrorTimerRef.current);
                limitErrorTimerRef.current = null;
              }
              setLimitExceeded(false);
              setEditValue(sanitizedValue);
              updateValue(parsedValue);

              if (parsedValue !== null) {
                formatTimerRef.current = setTimeout(() => {
                  const formattedValue = formatEditingValue(sanitizedValue, parsedValue);
                  setEditValue(formattedValue);
                  requestAnimationFrame(() => {
                    const input = amountRef.current;
                    if (!input) return;

                    let caret = formattedValue.length;
                    let remainingDigits = digitsAfterCaret;
                    while (caret > 0 && remainingDigits > 0) {
                      caret -= 1;
                      if (/\d/.test(formattedValue[caret] ?? "")) remainingDigits -= 1;
                    }

                    input.setSelectionRange(caret, caret);
                    input.dispatchEvent(new Event("scroll"));
                  });
                }, formatDelay);
              }
            }}
            onFocus={(event: FocusEvent<HTMLInputElement>) => {
              setEditing(true);
              setEditValue(formatValue(currentValue, true));
              onFocus?.(event);
            }}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              if (formatTimerRef.current) clearTimeout(formatTimerRef.current);
              setEditing(false);
              onBlur?.(event);
            }}
      />
    </div>
  );
}
