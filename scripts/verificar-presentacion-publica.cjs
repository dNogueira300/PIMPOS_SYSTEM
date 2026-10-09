/* eslint-disable @typescript-eslint/no-require-imports -- Comparación estructural local de cambios exclusivamente visuales. */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const ts = require("typescript");
const base = process.argv[2] || "adf156c1c12c815cf4a258a6fa03dbf4a4101e49";
const files = execFileSync("git", ["diff", "--name-only", base, "--", "src"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);
const printer = ts.createPrinter({ removeComments: true });
function normalizar(text, file) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const transformed = ts.transform(ast, [
    (context) => (root) => {
      function visit(node) {
        if (ts.isJsxText(node) && !node.text.trim()) return undefined;
        if (ts.isJsxAttribute(node) && node.name.getText() === "className") return undefined;
        if (ts.isVariableDeclaration(node) && node.name.getText() === "CAMPO")
          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            node.type,
            ts.factory.createStringLiteral("CLASES_VISUALES"),
          );
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(root, visit);
    },
  ]);
  const result = printer.printFile(transformed.transformed[0]);
  transformed.dispose();
  return result;
}
const checks = files.map((file) => ({
  file,
  onlyPresentation:
    file.endsWith(".tsx") &&
    normalizar(fs.readFileSync(file, "utf8"), file) ===
      normalizar(execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" }), file),
}));
const protectedFiles = execFileSync(
  "git",
  ["diff", "--name-only", base, "--", "src/lib", "supabase", "package.json", "pnpm-lock.yaml"],
  { encoding: "utf8" },
).trim();
console.log(JSON.stringify({ base, checks, protectedFilesUnchanged: !protectedFiles }, null, 2));
if (checks.some((c) => !c.onlyPresentation) || protectedFiles) process.exitCode = 1;
