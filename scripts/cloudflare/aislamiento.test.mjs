import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { entornoLocal, prepararCopia } from "./preparar.mjs";

test("rechaza destinos de Supabase alojados aunque las claves estén presentes", () => {
  assert.throws(
    () =>
      entornoLocal({
        API_URL: "https://produccion.supabase.co",
        ANON_KEY: "anon",
        SERVICE_ROLE_KEY: "privada",
      }),
    /local/,
  );
});

test("rechaza claves incompletas y no permite reutilizar variables del proceso", () => {
  assert.throws(() => entornoLocal({ API_URL: "http://127.0.0.1:54321" }), /ANON_KEY/);
});

test("solo entrega claves locales, desactiva correo y fija la URL de prueba", () => {
  const env = entornoLocal({
    API_URL: "http://127.0.0.1:54321",
    ANON_KEY: "local-anon",
    SERVICE_ROLE_KEY: "local-servidor",
    RESEND_API_KEY: "no-copiar",
    CLOUDFLARE_API_TOKEN: "no-copiar",
  });
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "http://127.0.0.1:54321");
  assert.equal(env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");
  assert.equal(env.RESEND_API_KEY, "");
  assert.equal(env.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, "local-servidor");
});

test("la copia conserva src byte a byte y no copia el entorno ni node_modules", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-aislamiento-"));
  await mkdir(path.join(repo, "src"));
  await writeFile(path.join(repo, "src", "ejemplo.ts"), "export const ejemplo = 1;\n");
  await writeFile(path.join(repo, ".env.local"), "SECRETO=no-copiar");
  await writeFile(
    path.join(repo, "postcss.config.mjs"),
    "export default { plugins: { '@tailwindcss/postcss': {} } };\n",
  );
  await mkdir(path.join(repo, "node_modules"));
  const destino = await prepararCopia(repo, { soloCodigo: true });
  assert.equal(
    await readFile(path.join(destino, "src", "ejemplo.ts"), "utf8"),
    "export const ejemplo = 1;\n",
  );
  await assert.rejects(readFile(path.join(destino, ".env.local")), { code: "ENOENT" });
  await assert.rejects(readFile(path.join(destino, "node_modules", "package.json")), {
    code: "ENOENT",
  });
  assert.equal(
    await readFile(path.join(destino, "postcss.config.mjs"), "utf8"),
    "export default { plugins: { '@tailwindcss/postcss': {} } };\n",
  );
});

test("rechaza una configuración enlazada en vez de copiarla fuera del repositorio", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-enlace-"));
  const externo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-externo-"));
  await mkdir(path.join(repo, "src"));
  await writeFile(path.join(externo, "centinela.txt"), "no-copiar");
  await symlink(
    externo,
    path.join(repo, "next.config.ts"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(prepararCopia(repo, { soloCodigo: true }), {
    message: /^No se copia un enlace:/,
  });
});

test("rechaza un destino enlazado antes de escribir cualquier archivo", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-destino-"));
  const externo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-externo-"));
  await symlink(
    externo,
    path.join(repo, ".superpowers"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(prepararCopia(repo, { soloCodigo: true }), /enlace/);
});

async function repositorioComparacion(cambios = {}) {
  const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-ci-version-"));
  for (const carpeta of ["src", "public", "e2e", "supabase", "scripts/cloudflare/dependencias"])
    await mkdir(path.join(repo, carpeta), { recursive: true });
  const base = {
    dependencies: { next: "16.3.4", react: "19.2.8" },
    devDependencies: { "eslint-config-next": "16.3.4" },
  };
  const copia = {
    dependencies: { ...base.dependencies, next: "16.3.8", ...cambios },
    devDependencies: { "eslint-config-next": "16.3.8" },
  };
  await writeFile(path.join(repo, "package.json"), JSON.stringify(base));
  const herramientas = path.join(repo, "scripts/cloudflare");
  await writeFile(path.join(herramientas, "dependencias/package.json"), JSON.stringify(copia));
  for (const archivo of ["pnpm-lock.yaml", "pnpm-workspace.yaml"])
    await writeFile(path.join(herramientas, "dependencias", archivo), "# fixture\n");
  for (const archivo of [
    "open-next.config.template",
    "playwright.config.template",
    "wrangler-local.json",
  ])
    await writeFile(path.join(herramientas, archivo), "{}\n");
  for (const archivo of [
    "next.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "eslint.config.mjs",
    "vitest.config.mts",
  ])
    await writeFile(path.join(repo, archivo), "{}\n");
  return repo;
}

test("compara solo Next 16.3.4 a 16.3.8 y registra ambas versiones sin cambiar producción", async () => {
  const repo = await repositorioComparacion();
  await prepararCopia(repo);
  const evidencia = JSON.parse(
    await readFile(path.join(repo, ".superpowers/validacion-cloudflare-ci/versiones.json"), "utf8"),
  );
  assert.deepEqual(evidencia.diferencias, [
    { dependencia: "next", produccion: "16.3.4", comparacion: "16.3.8" },
    { dependencia: "eslint-config-next", produccion: "16.3.4", comparacion: "16.3.8" },
  ]);
  const base = JSON.parse(await readFile(path.join(repo, "package.json"), "utf8"));
  assert.equal(base.dependencies.next, "16.3.4");
});

test("la comparación rechaza una versión de Next no autorizada", async () => {
  const repo = await repositorioComparacion({ next: "16.3.9" });
  await assert.rejects(prepararCopia(repo), /difiere de producción: next/);
});

test("la comparación rechaza cambios en cualquier otra dependencia de la aplicación", async () => {
  const repo = await repositorioComparacion({ react: "19.3.0" });
  await assert.rejects(prepararCopia(repo), /difiere de producción: react/);
});
