import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readRegistrySource(sourcePath: string) {
  if (!/^registry\/(components|blocks)\//.test(sourcePath) || sourcePath.split("/").includes("..")) {
    throw new Error("Source must be inside the public component or block registry.");
  }
  return readFileSync(join(process.cwd(), "registry", sourcePath.slice("registry/".length)), "utf8");
}
