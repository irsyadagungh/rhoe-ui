"use client";

import { useEffect, useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { MorphingText } from "@/registry/components/morphing-text/morphing-text";
import { Tabs } from "@/registry/components/tabs/tabs";
import styles from "./installation-command.module.css";

const storageKey = "sya-ui-package-manager";
const changeEvent = "sya-ui-package-manager-change";
const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;
type PackageManager = (typeof packageManagers)[number];

interface InstallationCommandViewProps {
  commands: Record<string, string>;
  commandSuffix: string;
}

const commandPrefix = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
} satisfies Record<PackageManager, string>;

function isPackageManager(value: string | null): value is PackageManager {
  return packageManagers.some((packageManager) => packageManager === value);
}

export function InstallationCommandView({ commands, commandSuffix }: InstallationCommandViewProps) {
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");

  useEffect(() => {
    const sync = () => {
      const saved = window.localStorage.getItem(storageKey);
      if (isPackageManager(saved)) setPackageManager(saved);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(changeEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(changeEvent, sync);
    };
  }, []);

  const select = (value: string) => {
    if (!isPackageManager(value)) return;
    setPackageManager(value);
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(new Event(changeEvent));
  };

  return (
    <Tabs
      ariaLabel="Package manager"
      className={styles.root}
      panelClassName={styles.panel}
      value={packageManager}
      onValueChange={select}
      items={packageManagers.map((value) => ({
        value,
        label: value,
        content: <InstallationCode command={commands[value]} prefix={commandPrefix[value]} suffix={commandSuffix} />,
      }))}
    />
  );
}

function InstallationCode({ command, prefix, suffix }: { command: string; prefix: string; suffix: string }) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const copied = copiedCommand === command;

  const copyCommand = async () => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    window.setTimeout(() => setCopiedCommand(null), 1600);
  };

  return (
    <div className={styles.commandBlock}>
      <div className={styles.commandHeader}>
        <span className={styles.commandLabel}><FileCode2 aria-hidden="true" size={16} />Code</span>
        <Button className={styles.copyButton} size="small" variant="text" onClick={copyCommand}>
          {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className={styles.commandSource}>
        <span className={styles.lineNumber} aria-hidden="true">1</span>
        <code><MorphingText className={styles.commandPrefix} value={prefix} /> <span>{suffix}</span></code>
      </div>
    </div>
  );
}
