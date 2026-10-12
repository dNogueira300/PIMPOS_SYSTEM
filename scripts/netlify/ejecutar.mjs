import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { realpath } from "node:fs/promises";
import path from "node:path";

import { comprobarPerfilLimpio, entornoSeguro, leerEntornoCli } from "./preparar.mjs";

const modo = process.argv[2];
const comandos = {
  build: ["build", "--offline", "--context", "production"],
  serve: ["serve", "--offline", "--port", "3000", "--context", "production"],
  pruebas: [
    "exec",
    "playwright",
    "test",
    "--config=playwright.netlify.config.ts",
    "--workers=1",
    ...process.argv.slice(3),
  ],
};
if (!(modo in comandos)) throw new Error("Solo build, serve o pruebas; no se admite despliegue.");
const cwd = process.cwd();
const temporal = process.env.PIMPOS_NETLIFY_TEMPORAL;
const esperado = temporal
  ? path.join(await realpath(process.env.RUNNER_TEMP), "pimpos-validacion-netlify", "app")
  : undefined;
if (
  (temporal
    ? cwd !== esperado
    : !cwd.endsWith(path.join(".superpowers", "validacion-netlify-ci", "app"))) ||
  (await realpath(cwd)) !== cwd
)
  throw new Error("Ejecuta únicamente en la copia aislada, sin enlaces.");
const env = entornoSeguro(process.env, leerEntornoCli(cwd));
if (modo !== "pruebas") await comprobarPerfilLimpio({ env });
const log = createWriteStream(path.join(cwd, "..", `${modo}.log`));
const bin = path.join(cwd, "../cli/node_modules/netlify-cli/bin/run.js");
const hijo = spawn(
  modo === "pruebas" ? "pnpm" : process.execPath,
  modo === "pruebas" ? comandos[modo] : [bin, ...comandos[modo]],
  {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: modo === "pruebas" && process.platform === "win32",
  },
);
hijo.stdout.on("data", (datos) => {
  process.stdout.write(datos);
  log.write(datos);
});
hijo.stderr.on("data", (datos) => {
  process.stderr.write(datos);
  log.write(datos);
});
for (const senal of ["SIGINT", "SIGTERM"]) process.on(senal, () => hijo.kill(senal));
hijo.on("error", (error) => {
  log.end();
  console.error(error.message);
  process.exitCode = 1;
});
hijo.on("exit", (codigo) => {
  log.end();
  process.exitCode = codigo ?? 1;
});
