import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  comprobarPerfilLimpio,
  entornoLocal,
  entornoSeguro,
  prepararCopia,
  verificarLock,
} from "./preparar.mjs";

const status = {
  API_URL: "http://127.0.0.1:54321",
  ANON_KEY: "anon-local",
  SERVICE_ROLE_KEY: "servidor-local",
};

const lockBase =
  "importers:\n  .:\n    dependencies:\n      next:\n        specifier: 16.3.4\n        version: 16.3.4(color@7.2.0)\npackages:\n";

test("rechaza un destino temporal distinto del reservado para CI", async () => {
  const repo = await repoFixture();
  const codigo = `const {prepararCopia} = await import(${JSON.stringify(new URL("./preparar.mjs", import.meta.url).href)}); await prepararCopia(process.argv[1], {destinoTemporal:true});`;
  assert.throws(
    () =>
      execFileSync(process.execPath, ["--input-type=module", "-e", codigo, repo], {
        env: {
          ...process.env,
          CI: "true",
          RUNNER_TEMP: os.tmpdir(),
          PIMPOS_NETLIFY_TEMPORAL: path.join(os.tmpdir(), "no-autorizado"),
        },
        stdio: "pipe",
      }),
    /directorio fijado/,
  );
});

test("rechaza cambios de resolución incluso con el mismo manifiesto", () => {
  assert.throws(
    () => verificarLock(lockBase, lockBase.replace("color@7.2.0", "color@11.0.0")),
    /resolución/,
  );
  assert.equal(verificarLock(lockBase, lockBase), 1);
});

test("rechaza perfiles modernos y heredados sin leer sus credenciales", async () => {
  const usuario = await mkdtemp(path.join(os.tmpdir(), "pimpos-netlify-perfil-"));
  const env = { CI: "true" };
  await comprobarPerfilLimpio({ plataforma: "linux", usuario, env });
  await assert.rejects(comprobarPerfilLimpio({ plataforma: "win32", usuario, env }), /Linux.*CI/);
  for (const carpeta of [".config/netlify", ".netlify"]) {
    const perfil = await mkdtemp(path.join(os.tmpdir(), "pimpos-netlify-perfil-"));
    await mkdir(path.join(perfil, carpeta), { recursive: true });
    await writeFile(path.join(perfil, carpeta, "config.json"), "centinela-no-leer");
    await assert.rejects(
      comprobarPerfilLimpio({ plataforma: "linux", usuario: perfil, env }),
      /perfil.*Netlify/,
    );
  }
});

test("solo acepta la URL local del CLI y claves completas", () => {
  for (const url of [
    "https://negocio.supabase.co",
    "http://127.0.0.1:54321/otro",
    "http://localhost:54321",
  ]) {
    assert.throws(() => entornoLocal({ ...status, API_URL: url }), /local/);
  }
  assert.throws(() => entornoLocal({ API_URL: status.API_URL }), /ANON_KEY/);
  assert.equal(entornoLocal(status).RESEND_API_KEY, "");
});

test("elimina secretos heredados y desactiva sesión/telemetría para el CLI offline", () => {
  const env = entornoSeguro(
    {
      PATH: "bin",
      NETLIFY_AUTH_TOKEN: "no-copiar",
      NEXT_PUBLIC_SUPABASE_URL: "https://negocio.supabase.co",
      SUPABASE_ACCESS_TOKEN: "no-copiar",
      AWS_SECRET_ACCESS_KEY: "no-copiar",
      RESEND_API_KEY: "no-copiar",
      CRON_SECRET: "negocio",
      DATABASE_URL: "no-copiar",
      VERCEL_TOKEN: "no-copiar",
    },
    entornoLocal(status),
  );
  assert.equal(env.PATH, "bin");
  for (const clave of [
    "NETLIFY_AUTH_TOKEN",
    "SUPABASE_ACCESS_TOKEN",
    "AWS_SECRET_ACCESS_KEY",
    "DATABASE_URL",
    "VERCEL_TOKEN",
  ])
    assert.equal(env[clave], undefined);
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, status.SERVICE_ROLE_KEY);
  assert.equal(env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");
  assert.equal(env.NETLIFY_TELEMETRY_DISABLED, "1");
  assert.equal(env.CRON_SECRET, "cron-secret-solo-para-las-pruebas");
});

async function repoFixture() {
  const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-netlify-"));
  for (const carpeta of [
    "src",
    "public",
    "e2e",
    "supabase",
    "scripts/netlify/dependencias",
    "scripts/netlify/cli",
    "node_modules",
  ])
    await mkdir(path.join(repo, carpeta), { recursive: true });
  await writeFile(path.join(repo, "src/ejemplo.ts"), "export const ejemplo = 1;\n");
  await writeFile(path.join(repo, "src/.env.local"), "SECRETO=no-copiar");
  await writeFile(path.join(repo, ".env.local"), "SECRETO=no-copiar");
  await writeFile(path.join(repo, "node_modules/centinela.txt"), "no-copiar");
  await writeFile(
    path.join(repo, "postcss.config.mjs"),
    "export default {plugins:{'@tailwindcss/postcss':{}}};\n",
  );
  return repo;
}

test("copia código y PostCSS exactos sin copiar secretos ni dependencias", async () => {
  const repo = await repoFixture();
  const destino = await prepararCopia(repo, { soloCodigo: true });
  assert.equal(
    path.resolve(
      execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: destino,
        encoding: "utf8",
      }).trim(),
    ),
    destino,
  );
  assert.equal(
    execFileSync("git", ["remote", "-v"], { cwd: destino, encoding: "utf8" }).trim(),
    "",
  );
  assert.equal(
    await readFile(path.join(destino, "src/ejemplo.ts"), "utf8"),
    await readFile(path.join(repo, "src/ejemplo.ts"), "utf8"),
  );
  assert.equal(
    await readFile(path.join(destino, "postcss.config.mjs"), "utf8"),
    await readFile(path.join(repo, "postcss.config.mjs"), "utf8"),
  );
  for (const archivo of [".env.local", "src/.env.local", "node_modules/centinela.txt"])
    await assert.rejects(readFile(path.join(destino, archivo)), { code: "ENOENT" });
  await assert.rejects(prepararCopia(repo, { soloCodigo: true }), { code: "EEXIST" });
});

test("rechaza enlaces de origen y destino antes de copiar su contenido", async () => {
  for (const relativo of ["postcss.config.mjs", ".superpowers"]) {
    const repo = await mkdtemp(path.join(os.tmpdir(), "pimpos-netlify-enlace-"));
    const fuera = await mkdtemp(path.join(os.tmpdir(), "pimpos-netlify-fuera-"));
    await mkdir(path.join(repo, "src"));
    await symlink(
      fuera,
      path.join(repo, relativo),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(prepararCopia(repo, { soloCodigo: true }), /enlace/);
  }
});

test("rechaza un manifiesto que cambia Next o añade dependencias funcionales", async () => {
  for (const nombre of ["next", "exceljs", "otra"]) {
    const repo = await repoFixture();
    const base = {
      dependencies: { next: "16.3.4", exceljs: "^4.4.0" },
      devDependencies: {},
      scripts: {},
    };
    const copia = structuredClone(base);
    copia.dependencies[nombre] = "99.0.0";
    copia.devDependencies = { "@netlify/plugin-nextjs": "5.16.2" };
    await writeFile(path.join(repo, "package.json"), JSON.stringify(base));
    await writeFile(
      path.join(repo, "scripts/netlify/dependencias/package.json"),
      JSON.stringify(copia),
    );
    await assert.rejects(prepararCopia(repo), /difiere/);
  }
});

test("acepta el adaptador y CLI separado dejando producción intacta", async () => {
  const repo = await repoFixture();
  const base = { dependencies: { next: "16.3.4" }, devDependencies: {}, scripts: {} };
  const copia = {
    ...base,
    devDependencies: { "@netlify/plugin-nextjs": "5.16.2" },
  };
  await writeFile(path.join(repo, "package.json"), JSON.stringify(base));
  await writeFile(
    path.join(repo, "scripts/netlify/dependencias/package.json"),
    JSON.stringify(copia),
  );
  for (const archivo of ["pnpm-lock.yaml", "pnpm-workspace.yaml"])
    await writeFile(path.join(repo, "scripts/netlify/dependencias", archivo), "# fixture\n");
  await writeFile(path.join(repo, "pnpm-lock.yaml"), lockBase);
  await writeFile(path.join(repo, "scripts/netlify/dependencias/pnpm-lock.yaml"), lockBase);
  for (const archivo of [
    "next.config.ts",
    "tsconfig.json",
    "eslint.config.mjs",
    "vitest.config.mts",
  ])
    await writeFile(path.join(repo, archivo), "{}\n");
  for (const archivo of ["netlify.template.toml", "playwright.config.template"])
    await writeFile(path.join(repo, "scripts/netlify", archivo), "# fixture\n");
  await writeFile(
    path.join(repo, "scripts/netlify/cli/package.json"),
    JSON.stringify({ dependencies: { "netlify-cli": "27.12.0" } }),
  );
  for (const archivo of ["pnpm-lock.yaml", "pnpm-workspace.yaml"])
    await writeFile(path.join(repo, "scripts/netlify/cli", archivo), "# fixture\n");
  const destino = await prepararCopia(repo);
  assert.equal(
    JSON.parse(await readFile(path.join(destino, "package.json"), "utf8")).dependencies.next,
    "16.3.4",
  );
  assert.deepEqual(JSON.parse(await readFile(path.join(repo, "package.json"), "utf8")), base);
  const evidencia = JSON.parse(await readFile(path.join(destino, "../versiones.json"), "utf8"));
  assert.deepEqual(evidencia.diferenciasAplicacion, []);
  const fuentes = JSON.parse(await readFile(path.join(destino, "../fuentes.json"), "utf8"));
  assert.deepEqual(
    fuentes.map((f) => f.archivo),
    ["src/ejemplo.ts"],
  );
});
