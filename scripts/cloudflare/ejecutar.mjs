import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { leerEntornoCli } from "./preparar.mjs";

const modo = process.argv[2];
const comandos = {
  build: ["exec", "opennextjs-cloudflare", "build"],
  preview: ["exec", "opennextjs-cloudflare", "preview", "--ip", "127.0.0.1", "--port", "3000"],
  pruebas: [
    "exec",
    "playwright",
    "test",
    "--config=playwright.cloudflare.config.ts",
    "--workers=1",
  ],
};
if (!(modo in comandos)) throw new Error("Usa build, preview o pruebas; no se admite despliegue.");
const cwd = process.cwd();
if (!cwd.endsWith(path.join(".superpowers", "validacion-cloudflare-ci", "app"))) {
  throw new Error("Ejecuta únicamente dentro de la copia aislada de validación.");
}
const locales = leerEntornoCli(cwd);
const env = { ...process.env, ...locales };
for (const nombre of Object.keys(env)) {
  if (/^(CLOUDFLARE_|CF_|WRANGLER_API_)/.test(nombre)) delete env[nombre];
}
// Variables de ejecución para workerd; jamás se sube este archivo como artefacto.
await writeFile(
  path.join(cwd, ".dev.vars"),
  Object.entries(locales)
    .map(([nombre, valor]) => `${nombre}=${JSON.stringify(valor)}`)
    .join("\n") + "\n",
);
const hijo = spawn("pnpm", comandos[modo], {
  cwd,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
for (const senal of ["SIGINT", "SIGTERM"]) process.on(senal, () => hijo.kill(senal));
hijo.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
hijo.on("exit", (codigo) => {
  process.exitCode = codigo ?? 1;
});
