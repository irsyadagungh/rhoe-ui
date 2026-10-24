"use client";

import { useRef, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { DropdownMenu } from "@/registry/components/dropdown-menu/dropdown-menu";
import styles from "./theme-switcher.module.css";

type ThemeMode = "light" | "dark" | "system";

const storageKey = "sya-ui-theme";
const themeChangeEvent = "sya-ui-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

function readTheme(): ThemeMode {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = mode;
  window.localStorage.setItem(storageKey, mode);
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeSwitcher() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system");

  const selectTheme = (nextTheme: ThemeMode) => {
    if (nextTheme === theme) return;

    // Let the dropdown fold first so it is not captured in the page transition.
    requestAnimationFrame(() => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const x = anchor ? anchor.left + anchor.width / 2 : window.innerWidth / 2;
      const y = anchor ? anchor.top + anchor.height / 2 : 0;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const startViewTransition = document.startViewTransition?.bind(document);

      if (!startViewTransition || reduceMotion) {
        applyTheme(nextTheme);
        return;
      }

      const transition = startViewTransition(() => {
        applyTheme(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.77, 0, 0.175, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    });
  };

  const icon = theme === "light" ? <Sun /> : theme === "dark" ? <Moon /> : <Monitor />;

  return (
    <div ref={anchorRef} className={styles.anchor}>
      <DropdownMenu
        label="Theme"
        ariaLabel="Choose theme"
        icon={icon}
        triggerContent="icon"
        expandedWidth={210}
        items={[
          { value: "light", label: "Light", icon: <Sun />, onSelect: () => selectTheme("light") },
          { value: "dark", label: "Dark", icon: <Moon />, onSelect: () => selectTheme("dark") },
          { value: "system", label: "System", icon: <Monitor />, onSelect: () => selectTheme("system") },
        ]}
      />
    </div>
  );
}
