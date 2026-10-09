/* eslint-disable @typescript-eslint/no-require-imports -- Evidencia visual del build con novedad propia de prueba exclusivamente local. */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/novedad");
fs.mkdirSync(out, { recursive: true });
const records = [];
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function api(route, method = "GET", body) {
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`API local ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function shot(page, route, name, width) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.goto("http://localhost:3000" + route);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const img of await page.locator("img:visible").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((el) => el.decode().catch(() => null));
  }
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  const axe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id);
  const file = `${name}-${width}.png`;
  await page.screenshot({ path: path.join(out, file), fullPage: true });
  records.push({
    route,
    role: "publico",
    width,
    state: "novedad temporal publicada",
    file,
    axe,
    ...metrics,
  });
  console.log(`${name}-${width}: axe=${axe.length}, overflow=${metrics.overflow}`);
}
(async () => {
  const browser = await chromium.launch();
  let user, notice, image;
  let page;
  const title = `Novedad de evidencia ${Date.now()}`;
  try {
    const email = `cierre-novedad-${Date.now()}@pimpos.test`;
    const password = "TemporalDePrueba2026";
    user = await api("/auth/v1/admin/users", "POST", { email, password, email_confirm: true });
    await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
      rol: "administrador",
      nombre_completo: "Prueba visual de novedades",
      activo: true,
    });
    const context = await browser.newContext({ reducedMotion: "reduce", locale: "es-PE" });
    page = await context.newPage();
    await page.goto("http://localhost:3000/ingresar");
    await page.getByLabel("Correo", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/admin");
    await page.goto("http://localhost:3000/admin/contenido/novedades/nueva");
    await page.getByLabel("Tipo", { exact: true }).selectOption("aviso");
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel(/^Resumen/).fill("Una imagen completa acompaña la novedad.");
    await page
      .getByLabel("Texto", { exact: true })
      .fill(
        "Registro temporal de comprobación visual. No anuncia promociones ni condiciones comerciales.",
      );
    await page.getByRole("tab", { name: "Imagen", exact: true }).click();
    await page
      .getByLabel(/Elegir de la galería/)
      .setInputFiles(
        path.resolve(
          "../PIMPOS_SYSTEM/DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/productos/producto-1-pan-frances-chico.webp",
        ),
      );
    await page.waitForFunction(() =>
      Boolean(document.querySelector('input[name="imagen_url"]')?.value),
    );
    image = await page.locator('input[name="imagen_url"]').inputValue();
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await page.getByText("Publicada. Ya se ve en el sitio.").waitFor();
    [notice] = await api(
      `/rest/v1/novedades?titulo=eq.${encodeURIComponent(title)}&select=id,slug`,
    );
    if (!notice) throw Error("No se encontró la novedad propia.");
    for (const width of [375, 390, 768, 1024, 1440]) {
      await shot(page, "/", "portada-con-novedad", width);
      const card = page
        .locator('section[aria-labelledby="titulo-novedades"]')
        .getByRole("link", { name: new RegExp(title) });
      await card.screenshot({ path: path.join(out, `tarjeta-${width}.png`) });
      await shot(page, `/novedades/${notice.slug}`, "detalle-novedad", width);
    }
  } finally {
    try {
      if (notice && page) {
        await page.goto(`http://localhost:3000/admin/contenido/novedades/${notice.id}`);
        await page.getByRole("button", { name: "Retirar del sitio", exact: true }).click();
        await page.getByText("Retirada del sitio.").waitFor();
      }
    } finally {
      const owned = notice
        ? [notice]
        : await api(`/rest/v1/novedades?titulo=eq.${encodeURIComponent(title)}&select=id`);
      for (const row of owned) await api(`/rest/v1/novedades?id=eq.${row.id}`, "DELETE");
      if (image) await api("/storage/v1/object/slides", "DELETE", { prefixes: [image] });
      if (user) await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
      await browser.close();
      fs.writeFileSync(
        path.join(out, "manifest.json"),
        JSON.stringify(
          {
            records,
            fixture:
              "Novedad temporal con foto original de Pimpo’s; no es contenido comercial aprobado",
            cleanup: { productionTouched: false, ownRowsRemoved: true },
          },
          null,
          2,
        ) + "\n",
      );
    }
  }
  if (records.some((r) => r.overflow || r.axe.length)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
