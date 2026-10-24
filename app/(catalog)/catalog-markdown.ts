import type { CatalogItem } from "./catalog-data";

export function markdownFor(component: CatalogItem) {
  return [
    `# ${component.title}`,
    "",
    component.lede,
    "",
    ...(component.guidance?.length
      ? ["## Experience", "", ...component.guidance.map((item) => `- ${item}`), ""]
      : []),
    "## Usage",
    "",
    "~~~tsx",
    component.usage,
    "~~~",
    "",
    ...(component.examples?.length
      ? [
          "## Variants",
          "",
          ...component.examples.flatMap((example) => [
            ...(example.title ? [`### ${example.title}`, ""] : []),
            ...(example.description ? [example.description, ""] : []),
            "~~~tsx",
            example.code,
            "~~~",
            "",
          ]),
        ]
      : []),
    "## Props",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    ...(component.api ?? []).map(([prop, type, defaultValue, description, required]) =>
      `| ${[required ? `${prop} (Required)` : prop, type, defaultValue, description].map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`,
    ),
    "",
    "## Motion",
    ...(component.behavior ?? []).map((item) => `- ${item}`),
    "",
    "## Accessibility",
    ...(component.accessibility ?? []).map((item) => `- ${item}`),
  ].join("\n");
}
