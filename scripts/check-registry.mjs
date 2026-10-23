// Compile each package in its own installation tree, so another registry item's
// files cannot accidentally hide missing dependencies (as they can in the docs).
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const registry = JSON.parse(await readFile("registry.json", "utf8"));
const index = JSON.parse(await readFile("public/r/registry.json", "utf8"));
assert.deepEqual(index, registry, "Public registry index is stale. Run registry:build.");
const temporaryRoot = await mkdtemp(path.join(tmpdir(), "rhoe-registry-check-"));
const sources = [];

try {
  await symlink(path.join(root, "node_modules"), path.join(temporaryRoot, "node_modules"), "dir");
  for (const item of registry.items) {
    const built = JSON.parse(await readFile(`public/r/${item.name}.json`, "utf8"));
    assert.deepEqual(built.files.map((file) => {
      const metadata = { ...file };
      delete metadata.content;
      return metadata;
    }), item.files,
      `${item.name}: generated file list differs from the manifest.`);
    assert.deepEqual(built.dependencies, item.dependencies, `${item.name}: stale dependencies.`);
    const targets = new Set(built.files.map((file) => file.target));

    for (const file of built.files) {
      const destination = path.join(temporaryRoot, item.name, file.target);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
      if (!/\.tsx?$/.test(file.target)) continue;
      sources.push(destination);

      for (const { fileName: specifier } of ts.preProcessFile(file.content, true, true).importedFiles) {
        if (specifier.startsWith(".")) {
          const base = path.posix.normalize(path.posix.join(path.posix.dirname(file.target), specifier));
          assert(["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]
            .some((extension) => targets.has(base + extension)),
          `${item.name}: ${file.target} imports missing ${specifier}`);
        } else {
          const dependency = specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
          assert(["react", "react-dom", ...(item.dependencies ?? [])].includes(dependency),
            `${item.name}: undeclared dependency ${dependency}`);
        }
      }
    }
  }

  const program = ts.createProgram(sources, {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => temporaryRoot,
      getNewLine: () => "\n",
    }));
  }
  console.log(`Validated ${registry.items.length} isolated registry packages: imports, dependencies, and TypeScript passed.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
