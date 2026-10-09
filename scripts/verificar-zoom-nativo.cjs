/* eslint-disable @typescript-eslint/no-require-imports -- Zoom real de Chromium en perfiles de prueba; no modifica preferencias del navegador de Dan. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const AxeBuilder = require("@axe-core/playwright").default;
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/zoom-nativo");
fs.mkdirSync(out, { recursive: true });
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const records = [];
async function api(route, method, body) {
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`API local ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function browser(scale) {
  const profile = path.resolve(".superpowers/zoom-nativo", randomUUID());
  fs.mkdirSync(path.join(profile, "Default"), { recursive: true });
  // Chromium: clave de partición "x" + ruta relativa vacía; nivel logarítmico 1.2.
  // Se exige además DPR real = escala, zoom CSS = 1 y ancho efectivo reducido.
  fs.writeFileSync(
    path.join(profile, "Default", "Preferences"),
    JSON.stringify({ partition: { default_zoom_level: { x: Math.log(scale) / Math.log(1.2) } } }),
  );
  return chromium.launchPersistentContext(profile, {
    headless: true,
    channel: "chromium",
    viewport: null,
    reducedMotion: "reduce",
    locale: "es-PE",
    args: ["--window-size=1440,1000", "--force-device-scale-factor=1"],
  });
}
async function shot(page, route, scale) {
  await page.goto("http://localhost:3000" + route);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img:visible").evaluateAll(async (imgs) => {
    imgs.forEach((img) => {
      img.loading = "eager";
    });
    await Promise.all(imgs.map((img) => img.decode().catch(() => null)));
  });
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    outer: outerWidth,
    dpr: devicePixelRatio,
    cssZoom: getComputedStyle(document.documentElement).zoom,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  if (
    geometry.dpr !== scale ||
    geometry.cssZoom !== "1" ||
    geometry.width > geometry.outer / scale + 1
  )
    throw Error(`Zoom nativo no confirmado: ${JSON.stringify(geometry)}`);
  const axe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
    id: v.id,
    impact: v.impact,
  }));
  const capture = `${route.replaceAll("/", "-").replace(/^-/, "") || "portada"}-${scale * 100}.png`;
  // Playwright fullPage recorta el bitmap con las medidas CSS al usar zoom
  // nativo. CDP conserva el viewport y captura las coordenadas físicas (DIP).
  const session = await page.context().newCDPSession(page);
  const metrics = await session.send("Page.getLayoutMetrics");
  const { data } = await session.send("Page.captureScreenshot", {
    captureBeyondViewport: true,
    clip: { ...metrics.contentSize, scale: 1 },
  });
  const bytes = Buffer.from(data, "base64");
  fs.writeFileSync(path.join(out, capture), bytes);
  await session.detach();
  records.push({
    route,
    scale,
    capture,
    axe,
    ...geometry,
    bitmapWidth: bytes.readUInt32BE(16),
    bitmapHeight: bytes.readUInt32BE(20),
  });
}
(async () => {
  let context;
  let user;
  try {
    context = await browser(1);
    await shot(await context.newPage(), "/ingresar", 1);
    await context.close();
    context = await browser(2);
    const page = await context.newPage();
    for (const route of [
      "/ingresar",
      "/",
      "/productos",
      "/productos/hamburguesa-grande",
      "/contacto",
      "/preguntas-frecuentes",
    ])
      await shot(page, route, 2);
    const correo = `cierre-zoom-${Date.now()}@pimpos.test`;
    const clave = "ClaveDePruebaZoom2026";
    user = await api("/auth/v1/admin/users", "POST", {
      email: correo,
      password: clave,
      email_confirm: true,
    });
    await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
      rol: "administrador",
      nombre_completo: "Prueba de zoom",
      activo: true,
    });
    await page.goto("http://localhost:3000/ingresar");
    await page.getByLabel("Correo", { exact: true }).fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(clave);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/admin");
    for (const route of [
      "/admin",
      "/admin/contenido/productos/nuevo",
      "/admin/configuracion",
      "/admin/insumos/ingreso",
      "/admin/insumos/reportes/existencias",
      "/admin/clientes/nuevo",
      "/admin/clientes",
      "/admin/auditoria",
    ])
      await shot(page, route, 2);
  } finally {
    await context?.close();
    if (user) await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          method:
            "Preferencias nativas de Chromium en perfiles desechables; sin CSS zoom ni emulación de escala",
          records,
          cleanup: { userRemoved: Boolean(user), productionTouched: false },
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (records.some((r) => r.overflow || r.axe.length)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
