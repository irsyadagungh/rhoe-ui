// Source and installation directories differ for blocks. Resolve imports against
// the manifest, then write the relative paths needed in the installed project.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path/posix";
import ts from "typescript";

const registry = JSON.parse(await readFile("registry.json", "utf8"));

for (const item of registry.items) {
  const output = `public/r/${item.name}.json`;
  const built = JSON.parse(await readFile(output, "utf8"));
  const files = new Map(item.files.map((file) => [file.path, file]));

  for (const file of built.files) {
    if (!/\.[cm]?[jt]sx?$/.test(file.path)) continue;
    const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
    const edits = [];

    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith(".")) continue;
      const base = path.normalize(path.join(path.dirname(file.path), specifier.text));
      const dependency = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]
        .map((extension) => files.get(base + extension)).find(Boolean);
      if (!dependency) throw new Error(`${item.name}: missing ${specifier.text} imported by ${file.path}`);

      let target = path.relative(path.dirname(file.target), dependency.target);
      // Keep CSS and explicit extensions; extensionless TS/JS imports stay so.
      if (!path.extname(specifier.text)) target = target.replace(/\.[jt]sx?$/, "");
      if (!target.startsWith(".")) target = `./${target}`;
      if (target !== specifier.text) {
        edits.push({ start: specifier.getStart(source) + 1, end: specifier.getEnd() - 1, target });
      }
    }

    for (const edit of edits.reverse()) {
      file.content = file.content.slice(0, edit.start) + edit.target + file.content.slice(edit.end);
    }
  }

  await writeFile(output, JSON.stringify(built, null, 2) + "\n");
}

console.log(`Prepared installation imports for ${registry.items.length} registry items.`);
