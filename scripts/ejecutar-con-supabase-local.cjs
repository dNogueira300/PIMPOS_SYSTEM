/* eslint-disable @typescript-eslint/no-require-imports -- Ejecuta herramientas Node contra la base local de pruebas. */
const { spawn } = require("node:child_process");
const { supabaseLocal } = require("../e2e/ayudas/supabase-local.ts");
const { CRON_SECRET_DE_PRUEBA } = require("../e2e/ayudas/cron.ts");

if (process.argv.length < 3) throw Error("Indica el guion Node que se ejecutará.");
const local = supabaseLocal();
if (new URL(local.apiUrl).hostname !== "127.0.0.1")
  throw Error("Esta herramienta solo admite Supabase local.");
const child = spawn(process.execPath, process.argv.slice(2), {
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: local.serviceRoleKey,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    CRON_SECRET: CRON_SECRET_DE_PRUEBA,
    RESEND_API_KEY: "",
    CORREO_ALERTAS: "",
  },
  stdio: "inherit",
});
child.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
