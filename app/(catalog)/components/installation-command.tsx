import { InstallationCommandView } from "./installation-command-view";

interface InstallationCommandProps {
  registry: string;
}

interface PackageManagerCommandProps {
  command: string;
}

const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

const commandPrefix = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
} satisfies Record<(typeof packageManagers)[number], string>;

export function InstallationCommand({ registry }: InstallationCommandProps) {
  return <PackageManagerCommand command={`shadcn@latest add @rhoe/${registry}`} />;
}

export function PackageManagerCommand({ command }: PackageManagerCommandProps) {
  const commands = Object.fromEntries(packageManagers.map((packageManager) => [
    packageManager,
    `${commandPrefix[packageManager]} ${command}`,
  ]));

  return <InstallationCommandView commands={commands} commandSuffix={command} />;
}
