/* eslint-disable @typescript-eslint/no-require-imports -- Capturas del build y cuentas temporales solo en Supabase local. */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/acceso");
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
async function shot(page, name, width, state) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("img")
    .evaluateAll(async (imgs) => Promise.all(imgs.map((img) => img.decode().catch(() => null))));
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images]
      .filter((img) => !img.complete || !img.naturalWidth)
      .map((img) => img.getAttribute("src")),
    form: [...document.querySelectorAll("input, button[type=submit]")].map((el) => ({
      type: el.getAttribute("type"),
      disabled: el.disabled,
    })),
    focus: document.activeElement?.getAttribute("id"),
  }));
  const axe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
    id: v.id,
    impact: v.impact,
  }));
  const capture = `${name}-${width}.png`;
  await page.screenshot({ path: path.join(out, capture), fullPage: true });
  records.push({
    route: new URL(page.url()).pathname,
    role: name.startsWith("clave") ? "ingeniero-temporal" : "sin-sesion",
    width,
    state,
    capture,
    axe,
    ...metrics,
  });
}
(async () => {
  const browser = await chromium.launch();
  let user;
  try {
    const context = await browser.newContext({ reducedMotion: "reduce", locale: "es-PE" });
    const page = await context.newPage();
    await page.goto("http://localhost:3000/ingresar");
    await page.getByLabel("Correo", { exact: true }).waitFor();
    for (const width of [375, 390, 768, 1024, 1440]) await shot(page, "login", width, "inicial");
    await page.getByLabel("Correo", { exact: true }).fill("no-existe@pimpos.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("ClaveIncorrecta2026");
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("http://localhost:3000/ingresar", async (route) => {
      if (route.request().method() === "POST") await gate;
      await route.continue();
    });
    const click = page.getByRole("button", { name: "Entrar", exact: true }).click();
    try {
      await page.locator("button[type=submit]:disabled").waitFor();
      for (const width of [390, 1440])
        await shot(page, "login-espera", width, "envío pendiente y botón deshabilitado");
    } finally {
      release();
    }
    await click;
    await page.unroute("http://localhost:3000/ingresar");
    await page
      .getByRole("alert")
      .filter({ hasText: /correo|contraseña/i })
      .waitFor();
    for (const width of [390, 1440])
      await shot(page, "login-error", width, "credenciales incorrectas");
    const correo = `cierre-acceso-${Date.now()}@pimpos.test`;
    const clave = "TemporalDePrueba2026";
    user = await api("/auth/v1/admin/users", "POST", {
      email: correo,
      password: clave,
      email_confirm: true,
      app_metadata: { debe_cambiar_clave: true },
    });
    await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
      rol: "ingeniero",
      nombre_completo: "Prueba visual de acceso",
      activo: true,
    });
    await page.goto("http://localhost:3000/ingresar");
    await page.getByLabel("Correo", { exact: true }).fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(clave);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/cambiar-clave");
    await page.getByLabel("Contraseña nueva", { exact: true }).waitFor();
    for (const width of [375, 390, 768, 1024, 1440])
      await shot(page, "clave", width, "contraseña temporal");
    await page.getByLabel("Contraseña nueva", { exact: true }).fill("ClaveDePrueba2026");
    await page.getByLabel("Repítela", { exact: true }).fill("NoCoincide2026");
    await page.getByRole("button", { name: "Guardar y entrar", exact: true }).click();
    await page.getByRole("alert").first().waitFor();
    for (const width of [390, 1440])
      await shot(page, "clave-error", width, "contraseñas diferentes; no se guarda");
    await context.close();
  } finally {
    if (user) await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
    await browser.close();
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          records,
          cleanup: {
            userRemoved: Boolean(user),
            credentialsChanged: false,
            productionTouched: false,
          },
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (records.some((r) => r.overflow || r.brokenImages.length || r.axe.length))
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
