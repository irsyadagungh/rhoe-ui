"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import "../foundation.css";

export interface ExpandableCardProps
  extends Omit<HTMLMotionProps<"article">, "children" | "title"> {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  width?: number;
  expandedWidth?: number;
  defaultExpanded?: boolean;
}

const still: Transition = { duration: 0 };

export function ExpandableCard({
  title,
  description,
  children,
  width,
  expandedWidth = width,
  defaultExpanded = false,
  className,
  style,
  onKeyDown,
  ...props
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [availableWidth, setAvailableWidth] = useState<number>();
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const cardWidth = useMotionValue<number | string>("100%");
  const firstMeasurement = useRef(true);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setAvailableWidth(track.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const cap = expanded ? expandedWidth : width;
  const measuredWidth = availableWidth
    ? Math.min(availableWidth, cap ?? availableWidth)
    : undefined;
  const contentWidth = availableWidth
    ? Math.min(availableWidth, expandedWidth ?? availableWidth)
    : undefined;

  useLayoutEffect(() => {
    if (measuredWidth === undefined) return;
    if (firstMeasurement.current) {
      firstMeasurement.current = false;
      cardWidth.jump(measuredWidth);
      return;
    }
    const controls = animate(cardWidth, measuredWidth, {
      ...(reduceMotion ? still : motionTokens.spring.smooth),
      delay: expanded ? 0 : 0.06,
    });
    return () => controls.stop();
  }, [cardWidth, expanded, measuredWidth, reduceMotion]);

  const caps = {
    "--card-width": width ? `${width}px` : undefined,
    "--card-expanded-width": expandedWidth ? `${expandedWidth}px` : undefined,
  } as CSSProperties;

  return (
    <div ref={trackRef} className="flex w-full min-w-0 justify-center">
      <motion.article
        {...props}
        className={["w-full max-w-[var(--card-width,100%)] overflow-hidden rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-resting)] data-[expanded=true]:max-w-[var(--card-expanded-width,var(--card-width,100%))] data-[measured]:max-w-full", className].filter(Boolean).join(" ")}
        data-expanded={expanded}
        data-measured={availableWidth === undefined ? undefined : ""}
        style={{ ...style, ...caps, width: cardWidth }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || !expanded) return;
          event.preventDefault();
          setExpanded(false);
          triggerRef.current?.focus();
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          className="flex min-h-[68px] w-full items-center justify-between gap-5 border-0 bg-transparent px-5 py-4 text-left text-[inherit] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] [webkit-tap-highlight-color:transparent] hover:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-[-3px] motion-reduce:transition-none"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="min-w-0">
            <strong className="block text-sm font-[620] tracking-[-0.01em]">{title}</strong>
            {description && <span className="mt-1 block text-xs leading-[1.5] text-[var(--text-secondary)]">{description}</span>}
          </span>
          <motion.span
            className="inline-flex shrink-0 text-[var(--text-secondary)]"
            aria-hidden="true"
            initial={false}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={reduceMotion ? still : motionTokens.spring.smooth}
          >
            <ChevronDown size={18} />
          </motion.span>
        </button>

        <motion.div
          id={panelId}
          className="overflow-hidden bg-[var(--surface-muted)] shadow-[inset_0_1px_0_var(--border)]"
          {...(!expanded ? { inert: true } : {})}
          initial={false}
          animate={{ height: expanded ? "auto" : 0 }}
          transition={reduceMotion ? still : { ...motionTokens.spring.smooth, delay: expanded ? 0 : 0.06 }}
        >
          <motion.div
            className="max-w-none px-5 pt-[18px] pb-5 text-sm leading-[1.65] text-[var(--text-secondary)]"
            style={contentWidth ? { width: contentWidth - 2 } : undefined}
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={
              reduceMotion
                ? still
                : expanded
                  ? { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard, delay: 0.12 }
                  : { duration: 0.1, ease: motionTokens.ease.standard }
            }
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.article>
    </div>
  );
}
