/* eslint-disable @typescript-eslint/no-require-imports -- Evidencia visual con usuarios temporales exclusivamente locales. */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo Supabase local.");
const BASE = "http://127.0.0.1:3000";
const out = path.resolve(process.argv[2] ?? "DOC/Maquetas/3.2/bloque3");
fs.mkdirSync(out, { recursive: true });
const users = [];
const records = [];
const focusRecords = [];
const cleanup = [];
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function api(route, method = "GET", body) {
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`API local ${route.split("?")[0]}: ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function shot(page, name, route, width, role, current = false) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  if (!current) await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.locator("main h1").waitFor({ state: "attached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Desplazar la página permite pedir las fotos diferidas antes de la captura completa.
  for (let y = 0; y < (await page.evaluate(() => document.documentElement.scrollHeight)); y += 600)
    await page.evaluate((y) => scrollTo(0, y), y);
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator("img:visible").evaluateAll(async (imgs) => {
    await Promise.all(imgs.map((i) => i.decode().catch(() => null)));
  });
  const measured = await page.evaluate(() => {
    const visible = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: [...document.images]
        .filter(visible)
        .filter((i) => !i.complete || !i.naturalWidth)
        .map((i) => i.getAttribute("src")),
      blue: [...document.querySelectorAll("main *,header *,aside *,footer *")]
        .filter(visible)
        .flatMap((e) =>
          ["color", "backgroundColor", "borderColor", "outlineColor", "fill", "stroke"].flatMap(
            (k) => {
              const v = getComputedStyle(e)[k];
              const m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              return m && +m[3] > +m[1] + 20 && +m[3] > +m[2] + 15
                ? [{ property: k, value: v }]
                : [];
            },
          ),
        ),
      avisos: [...document.querySelectorAll("[data-aviso]")].map((e) => ({
        clave: e.getAttribute("data-aviso"),
        texto: e.getAttribute("aria-label"),
        href: e.getAttribute("href"),
      })),
      secciones: [...document.querySelectorAll("[data-seccion]")].map((e) =>
        e.getAttribute("href"),
      ),
      cambios: document.querySelectorAll("[data-actividad-reciente] [data-cambio]").length,
      tapiz: getComputedStyle(document.querySelector("main")).backgroundImage,
      smallControls: [
        ...document.querySelectorAll(
          "main a,main button,header a,header button,aside a,aside button",
        ),
      ]
        .filter(visible)
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width < 44 || r.height < 44;
        })
        .map((e) => e.textContent.trim()),
    };
  });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const record = {
    name,
    route,
    width,
    role,
    ...measured,
    axe: axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  };
  records.push(record);
  await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  if (width === 390)
    await page.screenshot({ path: path.join(out, name + "-viewport.png"), fullPage: false });
  console.log(
    `${name}: overflow=${record.overflow}, axe=${record.axe.length}, azul=${record.blue.length}, fotos=${record.brokenImages.length}, objetivos=${record.smallControls.length}`,
  );
}
async function focusShot(page, selector, name) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.keyboard.press("Tab");
  const target = page.locator(selector).first();
  await target.focus();
  await target.scrollIntoViewIfNeeded();
  const state = await target.evaluate((el) => ({
    focused: document.activeElement === el,
    focusVisible: el.matches(":focus-visible"),
    outline: getComputedStyle(el).outline,
    outlineWidth: parseFloat(getComputedStyle(el).outlineWidth),
  }));
  focusRecords.push({ name, ...state });
  await page.screenshot({ path: path.join(out, name + ".png"), fullPage: false });
  if (!state.focused || !state.focusVisible || state.outlineWidth < 2)
    throw Error(`Foco no visible: ${name}`);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const role of ["administrador", "ingeniero", "repartidor"]) {
      const email = `dashboard-${randomUUID()}@pimpos.test`;
      const password = "EvidenciaLocalPimpos2026";
      const user = await api("/auth/v1/admin/users", "POST", {
        email,
        password,
        email_confirm: true,
      });
      users.push(user.id);
      await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
        rol: role,
        nombre_completo: `Diseño local ${role}`,
        activo: true,
      });
      const context = await browser.newContext({ reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(BASE + "/ingresar");
      await page.getByLabel("Correo", { exact: true }).fill(email);
      await page.getByLabel("Contraseña", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL("**/admin");
      for (const width of role === "administrador" ? [375, 390, 768, 1024, 1440] : [390, 1440])
        await shot(page, `inicio-${role}-${width}`, "/admin", width, role);
      await shot(page, `inicio-sin-acceso-${role}`, "/admin?motivo=sin-acceso", 390, role);
      if (role === "administrador") {
        await page.goto(BASE + "/admin");
        await focusShot(page, "main [data-seccion]", "inicio-foco-teclado");
        await page.goto(BASE + "/admin");
        await page.addStyleTag({ content: "html{zoom:2}" });
        await shot(page, "inicio-zoom-css-200", "/admin", 1440, role, true);
      }
      await context.close();
    }
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    // Reloj de evidencia del navegador, nunca el de la aplicación o la base.
    await page.clock.setFixedTime(new Date("2026-10-08T14:00:00Z"));
    for (const width of [375, 390, 768, 1024, 1440])
      await shot(page, `publico-${width}`, "/", width, "publico");
    await focusShot(page, '[aria-label="1 de 3"] .boton-cta', "publico-foco-teclado");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.goto(BASE + "/");
      await page.locator("#titulo-madrugada").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, `madrugada-${width}.png`), fullPage: false });
    }
    await page.clock.setFixedTime(new Date("2026-10-09T03:00:00Z"));
    await shot(page, "publico-cerrado-390", "/", 390, "publico");
    await context.close();
  } finally {
    for (const id of users) {
      try {
        await api(`/auth/v1/admin/users/${id}`, "DELETE");
        cleanup.push({ id, removed: true });
      } catch (e) {
        cleanup.push({ id, removed: false, error: e.message });
        process.exitCode = 1;
      }
    }
    await browser.close();
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          records,
          focusRecords,
          cleanup,
          note: "Fixtures locales; sin registros comerciales nuevos. Zoom CSS no equivale al zoom nativo.",
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (
    records.some(
      (r) =>
        r.overflow ||
        r.axe.length ||
        r.blue.length ||
        r.brokenImages.length ||
        r.smallControls.length,
    )
  )
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
