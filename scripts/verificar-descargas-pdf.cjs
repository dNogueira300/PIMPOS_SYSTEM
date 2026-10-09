/* eslint-disable @typescript-eslint/no-require-imports -- Descargas reales solo en el entorno local; no publica datos de clientes. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/pdf/descargas");
fs.mkdirSync(out, { recursive: true });
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const records = [];
async function api(route, method = "GET", body) {
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`API local ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
(async () => {
  const browser = await chromium.launch();
  let user;
  try {
    const correo = `cierre-pdf-${Date.now()}@pimpos.test`;
    const clave = "ClaveDePruebaPDF2026";
    user = await api("/auth/v1/admin/users", "POST", {
      email: correo,
      password: clave,
      email_confirm: true,
    });
    await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
      rol: "administrador",
      nombre_completo: "Prueba de PDF",
      activo: true,
    });
    const page = await browser.newPage();
    await page.goto("http://localhost:3000/ingresar");
    await page.getByLabel("Correo", { exact: true }).fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(clave);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/admin");
    const [sal] = await api("/rest/v1/insumos?nombre=eq.Sal&select=id");
    const routes = ["existencias", "consumo", "compras", "mermas", "kardex"].map((name) => ({
      name,
      route: `/admin/insumos/reportes/${name}/pdf${name === "kardex" ? `?insumo=${sal.id}&desde=2026-01-01&hasta=2099-12-31` : ""}`,
    }));
    routes.push({ name: "clientes", route: "/admin/clientes/pdf" });
    for (const { name, route } of routes) {
      const response = await page.request.get("http://localhost:3000" + route);
      const bytes = await response.body();
      const imagePresent = bytes.toString("latin1").includes("/Subtype /Image");
      const valid =
        response.status() === 200 &&
        response.headers()["content-type"]?.includes("application/pdf") &&
        bytes.subarray(0, 5).toString() === "%PDF-" &&
        imagePresent;
      records.push({
        name,
        route,
        status: response.status(),
        valid,
        logoEmbedded: imagePresent,
        bytes: bytes.length,
        disposition: response.headers()["content-disposition"],
      });
      if (!valid) throw Error(`PDF ${name} inválido: ${response.status()}`);
      // Los PDF de clientes se comprueban en memoria; las muestras publicables usan nombres ficticios de Vitest.
    }
  } finally {
    if (user) {
      await api(`/rest/v1/exportaciones_clientes?exportado_por=eq.${user.id}`, "DELETE");
      await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
    }
    await browser.close();
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          records,
          cleanup: {
            userRemoved: Boolean(user),
            exportsRemoved: Boolean(user),
            productionTouched: false,
          },
        },
        null,
        2,
      ) + "\n",
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
