import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { entornoLocal as entornoSupabase } from "../cloudflare/preparar.mjs";

export function verificarLock(base, copia) {
  // Formato fijado de pnpm 12: su lock contiene un documento para pnpm y otro para la app.
  const entradas = (texto) => {
    const bloques = [
      ...texto.replaceAll("\r", "").matchAll(/(?:^|\n)importers:\n([\s\S]*?)(?:\npackages:|$)/g),
    ];
    const bloque = bloques.find((b) => /^    (?:dependencies|devDependencies):$/m.test(b[1]));
    if (!bloque) throw new Error("No se pudo comprobar la resolución del lock de la aplicación.");
    const datos = new Map();
    let grupo;
    let clave;
    for (const linea of bloque[1].split("\n")) {
      const encabezado = /^    (dependencies|devDependencies):$/.exec(linea);
      const paquete = /^      ([^ ].*):$/.exec(linea);
      if (encabezado) {
        grupo = encabezado[1];
        clave = undefined;
      } else if (grupo && paquete) {
        clave = `${grupo}/${paquete[1].replace(/^['"]|['"]$/g, "")}`;
        datos.set(clave, []);
      } else if (clave && linea.startsWith("        ")) datos.get(clave).push(linea.trim());
    }
    return datos;
  };
  const originales = entradas(base);
  const comparacion = entradas(copia);
  for (const [nombre, valor] of originales)
    if (!isDeepStrictEqual(valor, comparacion.get(nombre)))
      throw new Error(`Cambió la resolución de ${nombre}.`);
  for (const nombre of comparacion.keys())
    if (!originales.has(nombre) && nombre !== "devDependencies/@netlify/plugin-nextjs")
      throw new Error(`Nueva resolución no autorizada: ${nombre}.`);
  return originales.size;
}

export async function comprobarPerfilLimpio({
  plataforma = process.platform,
  usuario = os.homedir(),
  env = process.env,
} = {}) {
  if (plataforma !== "linux" || env.CI !== "true")
    throw new Error(
      "El runtime Netlify se valida únicamente en Linux con CI, en un runner limpio.",
    );
  const moderno = path.join(
    env.XDG_CONFIG_HOME || path.join(usuario, ".config"),
    "netlify/config.json",
  );
  for (const perfil of [moderno, path.join(usuario, ".netlify/config.json")]) {
    try {
      await lstat(perfil);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    throw new Error("Ya existe un perfil de Netlify; no se cargan credenciales del usuario.");
  }
}

export function entornoLocal(status) {
  const env = entornoSupabase(status);
  for (const nombre of Object.keys(env)) {
    if (/^(WRANGLER_|OPEN_NEXT_)/.test(nombre)) delete env[nombre];
  }
  return env;
}

export function entornoSeguro(heredado, locales) {
  const env = { ...heredado };
  for (const nombre of Object.keys(env)) {
    if (
      /^(NEXT_PUBLIC_|SUPABASE_|PIMPOS_E2E_|NETLIFY_|CLOUDFLARE_|CF_|WRANGLER_|OPEN_NEXT_|VERCEL_|AWS_|RESEND_|CORREO_|CRON_|DATABASE_)/.test(
        nombre,
      )
    )
      delete env[nombre];
  }
  return {
    ...env,
    ...locales,
    HUSKY: "0",
    BROWSER: "none",
    NETLIFY_TELEMETRY_DISABLED: "1",
    NETLIFY_UPDATE_NOTIFIER_DISABLED: "1",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

async function directorioSeguro(destino) {
  await mkdir(destino).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  const info = await lstat(destino);
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new Error("No se permite un enlace en el destino aislado.");
}

export async function prepararCopia(repo, { soloCodigo = false, destinoTemporal = false } = {}) {
  const raiz = await realpath(repo);
  let trabajo = path.join(raiz, ".superpowers/validacion-netlify-ci");
  if (destinoTemporal) {
    if (
      process.platform !== "linux" ||
      process.env.CI !== "true" ||
      !process.env.RUNNER_TEMP ||
      path.resolve(process.env.PIMPOS_NETLIFY_TEMPORAL) !==
        path.join(path.resolve(process.env.RUNNER_TEMP), "pimpos-validacion-netlify")
    )
      throw new Error("El destino temporal solo acepta el directorio fijado del runner Linux.");
    trabajo = path.join(await realpath(process.env.RUNNER_TEMP), "pimpos-validacion-netlify");
  }
  const destino = path.join(trabajo, "app");
  const origenSeguro = async (relativo) => {
    const origen = path.resolve(raiz, relativo);
    const ruta = path.relative(raiz, origen);
    if (ruta.startsWith("..") || path.isAbsolute(ruta))
      throw new Error("Origen fuera del repositorio.");
    let actual = raiz;
    for (const parte of ruta.split(path.sep)) {
      actual = path.join(actual, parte);
      if ((await lstat(actual)).isSymbolicLink()) throw new Error(`No se copia un enlace: ${ruta}`);
    }
    return origen;
  };
  let base;
  let copia;
  let cli;
  let resoluciones;
  if (!soloCodigo) {
    base = JSON.parse(await readFile(await origenSeguro("package.json"), "utf8"));
    copia = JSON.parse(
      await readFile(await origenSeguro("scripts/netlify/dependencias/package.json"), "utf8"),
    );
    const sinHerramientas = structuredClone(copia);
    for (const [nombre, version] of Object.entries({ "@netlify/plugin-nextjs": "5.16.2" })) {
      if (sinHerramientas.devDependencies[nombre] !== version)
        throw new Error(`La copia difiere en herramienta: ${nombre}`);
      delete sinHerramientas.devDependencies[nombre];
    }
    if (!isDeepStrictEqual(base, sinHerramientas))
      throw new Error("La copia difiere de las dependencias/configuración de producción.");
    resoluciones = verificarLock(
      await readFile(await origenSeguro("pnpm-lock.yaml"), "utf8"),
      await readFile(await origenSeguro("scripts/netlify/dependencias/pnpm-lock.yaml"), "utf8"),
    );
    cli = JSON.parse(
      await readFile(await origenSeguro("scripts/netlify/cli/package.json"), "utf8"),
    );
    if (!isDeepStrictEqual(cli.dependencies, { "netlify-cli": "27.12.0" }))
      throw new Error("El toolchain CLI difiere del autorizado.");
  }
  if (!destinoTemporal) await directorioSeguro(path.join(raiz, ".superpowers"));
  await directorioSeguro(trabajo);
  // No reutilizar ni sobrescribir dependencias o evidencias anteriores.
  await mkdir(destino);
  const fuentes = [];
  const filtro = async (origen) => {
    const nombre = path.basename(origen);
    if (
      nombre.startsWith(".env") ||
      ["node_modules", ".next", ".netlify", ".open-next", ".temp"].includes(nombre)
    )
      return false;
    const relativo = path.relative(raiz, origen).split(path.sep).join("/");
    if (
      [
        "scripts/netlify/dependencias",
        "scripts/netlify/cli",
        "scripts/cloudflare/dependencias",
      ].includes(relativo)
    )
      return false;
    const info = await lstat(origen);
    if (info.isSymbolicLink()) throw new Error(`No se copia un enlace: ${relativo}`);
    if (info.isFile() && relativo.startsWith("src/"))
      fuentes.push({
        archivo: relativo,
        sha256: createHash("sha256")
          .update(await readFile(origen))
          .digest("hex"),
      });
    return true;
  };
  for (const carpeta of ["src", "public", "e2e", "supabase", "scripts"]) {
    try {
      await cp(await origenSeguro(carpeta), path.join(destino, carpeta), {
        recursive: true,
        filter: filtro,
      });
    } catch (error) {
      if (!soloCodigo || error.code !== "ENOENT") throw error;
    }
  }
  for (const archivo of [
    "next.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "eslint.config.mjs",
    "vitest.config.mts",
  ]) {
    try {
      await cp(await origenSeguro(archivo), path.join(destino, archivo), { filter: filtro });
    } catch (error) {
      if (!soloCodigo || error.code !== "ENOENT") throw error;
    }
  }
  if (!soloCodigo) {
    const destinoCli = path.join(trabajo, "cli");
    await mkdir(destinoCli);
    for (const archivo of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"])
      await cp(
        await origenSeguro(`scripts/netlify/cli/${archivo}`),
        path.join(destinoCli, archivo),
      );
    for (const archivo of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"])
      await cp(
        await origenSeguro(`scripts/netlify/dependencias/${archivo}`),
        path.join(destino, archivo),
      );
    await cp(
      await origenSeguro("scripts/netlify/netlify.template.toml"),
      path.join(destino, "netlify.toml"),
    );
    await cp(
      await origenSeguro("scripts/netlify/playwright.config.template"),
      path.join(destino, "playwright.netlify.config.ts"),
    );
    await writeFile(
      path.join(trabajo, "versiones.json"),
      JSON.stringify(
        {
          next: base.dependencies.next,
          herramientas: {
            "netlify-cli": cli.dependencies["netlify-cli"],
            "@netlify/plugin-nextjs": copia.devDependencies["@netlify/plugin-nextjs"],
          },
          diferenciasAplicacion: [],
          resolucionesDirectasIdenticas: resoluciones,
        },
        null,
        2,
      ) + "\n",
    );
  }
  await writeFile(
    path.join(trabajo, "fuentes.json"),
    JSON.stringify(
      fuentes.sort((a, b) => a.archivo.localeCompare(b.archivo)),
      null,
      2,
    ) + "\n",
  );
  // La copia representa el repositorio raíz de producción, sin remotos ni hooks heredados.
  execFileSync("git", ["init", "--quiet", "--template="], { cwd: destino });
  return destino;
}

export function leerEntornoCli(cwd) {
  const salida = execFileSync("supabase", ["status", "-o", "json"], {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return entornoLocal(JSON.parse(salida));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
  console.log(
    `Copia Netlify: ${path.relative(repo, await prepararCopia(repo, { destinoTemporal: Boolean(process.env.PIMPOS_NETLIFY_TEMPORAL) }))}`,
  );
}
