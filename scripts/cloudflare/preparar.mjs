import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const URL_PRUEBA = "http://localhost:3000";

export function entornoLocal(status) {
  const url = new URL(status.API_URL);
  if (
    url.origin !== "http://127.0.0.1:54321" ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("La validación solo acepta el Supabase local del CLI.");
  }
  for (const clave of ["ANON_KEY", "SERVICE_ROLE_KEY"]) {
    if (!status[clave]) throw new Error(`Falta ${clave} del Supabase local.`);
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: url.origin,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: URL_PRUEBA,
    CRON_SECRET: "cron-secret-solo-para-las-pruebas",
    RESEND_API_KEY: "",
    CORREO_ALERTAS: "",
    NEXT_TELEMETRY_DISABLED: "1",
    WRANGLER_SEND_METRICS: "false",
    OPEN_NEXT_DEBUG: "1",
    OPEN_NEXT_ERROR_LOG_LEVEL: "0",
    PIMPOS_E2E_API_URL: url.origin,
    PIMPOS_E2E_ANON_KEY: status.ANON_KEY,
    PIMPOS_E2E_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  };
}

async function directorioSeguro(directorio) {
  await mkdir(directorio).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  const info = await lstat(directorio);
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new Error("No se permite un enlace en el destino aislado.");
}

export async function prepararCopia(repo, { soloCodigo = false } = {}) {
  const raiz = await realpath(repo);
  const temporal = path.join(raiz, ".superpowers");
  await directorioSeguro(temporal);
  const trabajo = path.join(temporal, "validacion-cloudflare-ci");
  await directorioSeguro(trabajo);
  const destino = path.join(trabajo, "app");
  // No borrar ni sobrescribir una ejecución anterior: debe ser un checkout limpio.
  await mkdir(destino);
  const archivos = [];
  const filtro = async (origen) => {
    const nombre = path.basename(origen);
    if (
      nombre.startsWith(".env") ||
      ["node_modules", ".next", ".open-next", ".temp"].includes(nombre)
    )
      return false;
    if (origen === path.join(raiz, "scripts", "cloudflare", "dependencias")) return false;
    const info = await lstat(origen);
    if (info.isSymbolicLink())
      throw new Error(`No se copia un enlace: ${path.relative(raiz, origen)}`);
    if (info.isFile() && origen.startsWith(path.join(raiz, "src") + path.sep)) {
      archivos.push({
        archivo: path.relative(raiz, origen).split(path.sep).join("/"),
        sha256: createHash("sha256")
          .update(await readFile(origen))
          .digest("hex"),
      });
    }
    return true;
  };
  const origenSeguro = async (origen) => {
    const relativo = path.relative(raiz, origen);
    if (relativo.startsWith("..") || path.isAbsolute(relativo))
      throw new Error("Origen fuera del repositorio.");
    let actual = raiz;
    for (const parte of relativo.split(path.sep)) {
      actual = path.join(actual, parte);
      if ((await lstat(actual)).isSymbolicLink())
        throw new Error(`No se copia un enlace: ${path.relative(raiz, actual)}`);
    }
    return origen;
  };
  const copiarArchivo = async (origen, salida) => {
    await origenSeguro(origen);
    await cp(origen, salida, { filter: filtro });
  };
  for (const carpeta of ["src", "public", "e2e", "supabase", "scripts"]) {
    try {
      await lstat(path.join(raiz, carpeta));
    } catch (error) {
      if (soloCodigo && error.code === "ENOENT") continue;
      throw error;
    }
    await cp(path.join(raiz, carpeta), path.join(destino, carpeta), {
      recursive: true,
      filter: filtro,
    });
  }
  for (const archivo of [
    "next.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "eslint.config.mjs",
    "vitest.config.mts",
  ]) {
    try {
      await copiarArchivo(path.join(raiz, archivo), path.join(destino, archivo));
    } catch (error) {
      if (soloCodigo && error.code === "ENOENT") continue;
      throw error;
    }
  }
  if (!soloCodigo) {
    const herramientas = path.join(raiz, "scripts", "cloudflare");
    const paquete = JSON.parse(
      await readFile(await origenSeguro(path.join(raiz, "package.json")), "utf8"),
    );
    const copia = JSON.parse(
      await readFile(
        await origenSeguro(path.join(herramientas, "dependencias", "package.json")),
        "utf8",
      ),
    );
    for (const grupo of ["dependencies", "devDependencies"]) {
      for (const [nombre, version] of Object.entries(paquete[grupo])) {
        if (copia[grupo][nombre] !== version)
          throw new Error(
            `La copia difiere de producción: ${nombre}. Actualiza el manifiesto y lock de la validación.`,
          );
      }
    }
    for (const archivo of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
      await copiarArchivo(
        path.join(herramientas, "dependencias", archivo),
        path.join(destino, archivo),
      );
    }
    await copiarArchivo(
      path.join(herramientas, "open-next.config.template"),
      path.join(destino, "open-next.config.ts"),
    );
    await copiarArchivo(
      path.join(herramientas, "playwright.config.template"),
      path.join(destino, "playwright.cloudflare.config.ts"),
    );
    await copiarArchivo(
      path.join(herramientas, "wrangler-local.json"),
      path.join(destino, "wrangler.jsonc"),
    );
  }
  await writeFile(
    path.join(trabajo, "fuentes.json"),
    JSON.stringify(
      archivos.sort((a, b) => a.archivo.localeCompare(b.archivo)),
      null,
      2,
    ) + "\n",
  );
  return destino;
}

export function leerEntornoCli(cwd) {
  // No se acepta una URL tomada del entorno: la fuente es el CLI local.
  const salida = execFileSync("supabase", ["status", "-o", "json"], {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return entornoLocal(JSON.parse(salida));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const destino = await prepararCopia(raiz);
  console.log(`Copia de validación: ${path.relative(raiz, destino)}`);
}
