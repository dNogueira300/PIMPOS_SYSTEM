/* eslint-disable @typescript-eslint/no-require-imports -- Guion local CommonJS, ejecutado directamente por Node. */
// Preview only: the existing build, bound to loopback with Supabase CLI demo keys.
const { createHmac } = require("node:crypto");
const { spawn } = require("node:child_process");
function localKey(role) {
  const enc = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  const data = `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ iss: "supabase-demo", role, exp: 1983812996 })}`;
  return `${data}.${createHmac("sha256", "super-secret-jwt-token-with-at-least-32-characters-long").update(data).digest("base64url")}`;
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localKey("anon"),
      SUPABASE_SERVICE_ROLE_KEY: localKey("service_role"),
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      RESEND_API_KEY: "",
      RESEND_FROM: "",
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
process.on("SIGINT", () => child.kill());
