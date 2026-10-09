/* eslint-disable @typescript-eslint/no-require-imports -- Regresión serial contra un único build local, con informes sin entorno ni claves. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!api || new URL(api).hostname !== "127.0.0.1") throw Error("Solo Supabase local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/pruebas");
const raw = path.resolve(".superpowers/regresion-t7");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(raw, { recursive: true });
const build = fs.readFileSync(".next/BUILD_ID", "utf8").trim();
const files = fs
  .readdirSync("e2e")
  .filter((f) => f.endsWith(".spec.ts"))
  .sort();
function rows(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.map((test) => ({
        key: `${spec.file}:${spec.line}:${spec.title}:${test.projectName}`,
        file: spec.file,
        title: spec.title,
        project: test.projectName,
        status: test.status,
        results: test.results.map((r) => r.status),
        skips: (test.annotations ?? []).filter((a) => a.type === "skip").map((a) => a.description),
      })),
    ),
    ...rows(suite.suites ?? []),
  ]);
}
function run(name, args) {
  const report = path.join(raw, `${name}.json`);
  const log = fs.openSync(path.join(out, `${name}.txt`), "w");
  try {
    const result = spawnSync(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test", ...args, "--reporter=list,json"],
      {
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: report },
        stdio: ["ignore", log, log],
      },
    );
    if (result.error) throw result.error;
    const data = JSON.parse(fs.readFileSync(report, "utf8"));
    // Nunca publicar config: puede contener las credenciales del entorno local.
    return {
      exitCode: result.status,
      stats: data.stats,
      tests: rows(data.suites),
      errors: data.errors.map((e) => e.message),
    };
  } finally {
    fs.closeSync(log);
  }
}
const listed = run("lista-e2e", ["--list"]);
const manifestPath = path.join(out, "regresion-completa.json");
const previous =
  process.argv.includes("--reanudar") && fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : null;
if (
  previous &&
  (previous.build !== build || JSON.stringify(previous.files) !== JSON.stringify(files))
)
  throw Error("No se puede reanudar con otro build o inventario de archivos.");
const manifest = previous ?? {
  build,
  files,
  listed: listed.tests.length,
  chunks: [],
  complete: false,
};
manifest.attempts ??= [];
if (previous) {
  const failed = manifest.chunks.filter((c) => c.exitCode !== 0);
  manifest.attempts.push(...failed);
  manifest.chunks = manifest.chunks.filter((c) => c.exitCode === 0);
}
fs.writeFileSync(path.join(out, "lista-e2e.json"), JSON.stringify(listed.tests, null, 2) + "\n");
const save = () =>
  fs.writeFileSync(
    path.join(out, "regresion-completa.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
save();
for (let i = 0; i < files.length; i += 7) {
  if (fs.readFileSync(".next/BUILD_ID", "utf8").trim() !== build)
    throw Error("El build cambió durante la regresión.");
  const group = files.slice(i, i + 7);
  const name = `tanda-${Math.floor(i / 7) + 1}`;
  if (manifest.chunks.some((c) => c.name === name && c.exitCode === 0)) continue;
  console.log(`Iniciando ${name}: ${group.join(", ")}`);
  const result = run(name, [...group.map((f) => `e2e/${f}`), "--workers=1"]);
  manifest.chunks.push({ name, files: group, ...result });
  save();
  console.log(`${name}: ${JSON.stringify(result.stats)}`);
  if (result.exitCode !== 0) {
    process.exitCode = 1;
    break;
  }
}
const executed = manifest.chunks.flatMap((c) => c.tests);
const expectedKeys = new Set(listed.tests.map((t) => t.key));
const executedKeys = new Set(executed.map((t) => t.key));
manifest.missing = [...expectedKeys].filter((key) => !executedKeys.has(key));
manifest.extra = [...executedKeys].filter((key) => !expectedKeys.has(key));
manifest.buildUnchanged = fs.readFileSync(".next/BUILD_ID", "utf8").trim() === build;
manifest.complete =
  manifest.missing.length === 0 &&
  manifest.extra.length === 0 &&
  manifest.buildUnchanged &&
  manifest.chunks.every((c) => c.exitCode === 0);
manifest.summary = executed.reduce((acc, t) => {
  acc[t.status] = (acc[t.status] ?? 0) + 1;
  return acc;
}, {});
save();
if (!manifest.complete) process.exitCode = 1;
console.log(
  `Resultado: ${JSON.stringify({ complete: manifest.complete, listed: manifest.listed, summary: manifest.summary, missing: manifest.missing.length })}`,
);
