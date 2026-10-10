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
