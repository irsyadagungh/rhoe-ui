"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/registry/components/button/button";
import { Tabs } from "@/registry/components/tabs/tabs";
import { Moon, Sun } from "lucide-react";
import styles from "./theming.module.css";

type Mode = "light" | "dark";
type ThemeColors = Record<ColorKey, string>;
type PreviewStyle = CSSProperties & Record<`--${string}`, string>;

const colorFields = [
  ["canvas", "Canvas"],
  ["surface", "Surface"],
  ["surface-muted", "Muted surface"],
  ["text", "Text"],
  ["text-secondary", "Secondary text"],
  ["primary", "Primary"],
  ["primary-foreground", "Primary text"],
  ["success", "Success"],
  ["success-foreground", "Success text"],
  ["success-surface", "Success surface"],
  ["success-surface-foreground", "Success surface text"],
  ["warning", "Warning"],
  ["warning-foreground", "Warning text"],
  ["warning-surface", "Warning surface"],
  ["warning-surface-foreground", "Warning surface text"],
  ["danger", "Danger"],
  ["danger-foreground", "Danger text"],
  ["danger-surface", "Danger surface"],
  ["danger-surface-foreground", "Danger surface text"],
  ["border", "Border"],
  ["focus", "Focus ring"],
] as const;

type ColorKey = (typeof colorFields)[number][0];

const defaults: Record<Mode, ThemeColors> = {
  light: {
    canvas: "#eef1ed",
    surface: "#fcfdfb",
    "surface-muted": "#e2e6e1",
    text: "#191b19",
    "text-secondary": "#59605b",
    primary: "#252725",
    "primary-foreground": "#f8faf8",
    success: "#18794e",
    "success-foreground": "#ffffff",
    "success-surface": "#e7f6ec",
    "success-surface-foreground": "#17653f",
    warning: "#946200",
    "warning-foreground": "#ffffff",
    "warning-surface": "#fff3d6",
    "warning-surface-foreground": "#6b4600",
    danger: "#b42318",
    "danger-foreground": "#ffffff",
    "danger-surface": "#fce8e6",
    "danger-surface-foreground": "#8f1d14",
    border: "#d9ddd9",
    focus: "#3f6652",
  },
  dark: {
    canvas: "#121412",
    surface: "#1a1d1a",
    "surface-muted": "#232623",
    text: "#f1f3f0",
    "text-secondary": "#afb5b0",
    primary: "#ecefeb",
    "primary-foreground": "#1b1d1b",
    success: "#62c98f",
    "success-foreground": "#092416",
    "success-surface": "#173526",
    "success-surface-foreground": "#8ee0ae",
    warning: "#e9ad45",
    "warning-foreground": "#291900",
    "warning-surface": "#3b2b12",
    "warning-surface-foreground": "#f2c66f",
    danger: "#ff716b",
    "danger-foreground": "#260503",
    "danger-surface": "#3d1d1c",
    "danger-surface-foreground": "#ffaaa5",
    border: "#373b37",
    focus: "#93b7a2",
  },
};

export function ThemeCustomizer() {
  const [mode, setMode] = useState<Mode>("dark");
  const [themes, setThemes] = useState(defaults);
  const [copied, setCopied] = useState(false);
  const colors = themes[mode];

  const previewStyle = Object.fromEntries(
    Object.entries(colors).map(([name, value]) => [`--${name}`, value]),
  ) as PreviewStyle;

  const css = useMemo(
    () =>
      `html[data-theme="${mode}"] {\n${Object.entries(colors)
        .map(([name, value]) => `  --${name}: ${value};`)
        .join("\n")}\n}`,
    [colors, mode],
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const updateColor = (name: ColorKey, value: string) => {
    setThemes((current) => ({
      ...current,
      [mode]: { ...current[mode], [name]: value },
    }));
  };

  const copyCss = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
  };

  const editor = (
    <div className={styles.customizerBody}>
      <div className={styles.colorControls}>
        {colorFields.map(([name, label]) => (
          <label className={styles.colorControl} key={name}>
            <span>{label}</span>
            <span className={styles.colorInputGroup}>
              <input
                className={styles.colorPicker}
                type="color"
                value={colors[name]}
                onChange={(event) => updateColor(name, event.target.value)}
                aria-label={`${label} color picker`}
              />
              <input
                className={styles.hexInput}
                value={colors[name]}
                pattern="#[0-9a-fA-F]{6}"
                spellCheck={false}
                onChange={(event) => updateColor(name, event.target.value)}
                aria-label={`${label} hex value`}
              />
            </span>
          </label>
        ))}
      </div>

      <div className={styles.themePreview} style={previewStyle} data-preview-theme={mode}>
        <div className={styles.previewWindow}>
          <p className={styles.previewLabel}>Custom theme</p>
          <h3>Quiet infrastructure, clear actions.</h3>
          <p>
            Surfaces stay neutral while hierarchy comes from contrast and spacing.
          </p>
          <div className={styles.previewActions}>
            <span className={styles.previewPrimary}>Continue</span>
            <span className={styles.previewSecondary}>View details</span>
          </div>
          <div className={styles.previewStatuses}>
            <span
              className={styles.previewSuccess}
              style={{
                background: "var(--success-surface)",
                color: "var(--success-surface-foreground)",
              }}
            >
              Success
            </span>
            <span
              className={styles.previewWarning}
              style={{
                background: "var(--warning-surface)",
                color: "var(--warning-surface-foreground)",
              }}
            >
              Warning
            </span>
            <span
              className={styles.previewDanger}
              style={{
                background: "var(--danger-surface)",
                color: "var(--danger-surface-foreground)",
              }}
            >
              Danger
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.customizer}>
      <div className={styles.customizerHeader}>
        <div>
          <strong>Theme editor</strong>
          <span>Changes are reflected in the preview.</span>
        </div>
        <Button
          size="small"
          variant="bordered"
          onClick={() =>
            setThemes((current) => ({ ...current, [mode]: defaults[mode] }))
          }
        >
          Reset {mode}
        </Button>
      </div>

      <Tabs
        className={styles.themeTabs}
        listClassName={styles.modeTabs}
        panelClassName={styles.editorPanel}
        variant="grouped"
        value={mode}
        ariaLabel="Theme mode"
        onValueChange={(value) => setMode(value as Mode)}
        items={[
          { value: "light", label: "Light", icon: <Sun size={15} />, content: editor },
          { value: "dark", label: "Dark", icon: <Moon size={15} />, content: editor },
        ]}
      />

      <div className={styles.cssOutput}>
        <div className={styles.cssOutputHeader}>
          <span>theme.css</span>
          <Button size="small" variant="text" onClick={copyCss}>
            {copied ? "Copied" : "Copy CSS"}
          </Button>
        </div>
        <pre><code>{css}</code></pre>
      </div>
    </div>
  );
}
