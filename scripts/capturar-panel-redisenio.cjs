/* eslint-disable @typescript-eslint/no-require-imports -- Guion de captura local ejecutado como CommonJS por Node. */
const { chromium } = require("@playwright/test");
const { createHmac, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const BASE = "http://127.0.0.1:3000";
const API = "http://127.0.0.1:54321";
const out = path.resolve(process.argv[2] ?? "DOC/Maquetas/comparacion-redisenio/evidencia");
// Same local-only demo signing secret used by Supabase CLI. Never reads .env.local.
const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const data = `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ iss: "supabase-demo", role: "service_role", exp: 1983812996 })}`;
const key = `${data}.${createHmac("sha256", "super-secret-jwt-token-with-at-least-32-characters-long").update(data).digest("base64url")}`;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const users = [];
const manifest = [];
async function api(route, method = "GET", body) {
  if (new URL(API).hostname !== "127.0.0.1") throw Error("Only local API allowed");
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`Local API ${route.split("?")[0]}: ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function capture(page, name, route, role, width) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
  if (route.startsWith("/admin")) await page.locator("main#contenido").waitFor({ timeout: 25000 });
  await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true });
  const item = await page.evaluate(() => ({
    title: document.title,
    path: location.pathname,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector("h1")?.textContent,
    images: [...document.images].map((i) => ({
      alt: i.alt,
      src: new URL(i.src).pathname,
      loaded: i.complete && i.naturalWidth > 0,
    })),
    labels: [...document.querySelectorAll("main label")].map((e) => e.textContent),
    logoContainer: (() => {
      const logo = [...document.images].find(
        (i) => i.offsetParent !== null && i.alt === "Panadería Pimpo's",
      );
      if (!logo) return null;
      const box = logo.parentElement.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        radius: getComputedStyle(logo.parentElement).borderRadius,
      };
    })(),
  }));
  manifest.push({ name, role, requested: route, ...item });
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`${role} ${route} ${width}: ${item.h1} width=${item.scrollWidth}`);
}
async function states(page) {
  const records = [];
  async function shot(name, note = "Build real; sin inyección de estilos") {
    const measured = await page.evaluate(() => ({
      path: location.pathname,
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      focus: document.activeElement?.getAttribute("name"),
      disabled: [...document.querySelectorAll("button:disabled")].map((el) => el.textContent),
      blueStyles: [...document.querySelectorAll("body *")]
        .filter((el) => el.getClientRects().length)
        .flatMap((el) => {
          const style = getComputedStyle(el);
          return ["color", "backgroundColor", "borderTopColor", "outlineColor"].flatMap((prop) => {
            const match = style[prop].match(/^rgba?\((\d+), (\d+), (\d+)/);
            if (!match) return [];
            const [r, g, b] = match.slice(1).map(Number);
            return b > r + 20 && b > g + 10 ? [{ tag: el.tagName, prop, color: style[prop] }] : [];
          });
        }),
    }));
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    records.push({ name, note, ...measured });
    fs.writeFileSync(path.join(out, "estados.json"), JSON.stringify(records, null, 2));
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(BASE + "/admin/configuracion");
    await page.getByRole("tab", { name: "Contacto", exact: true }).hover();
    await shot(`pestana-hover-${width}`);
    await page.getByRole("tab", { name: "Horarios", exact: true }).click();
    const monday = page.locator('[data-dia="lunes"]');
    await monday.getByLabel("Turno 1: abre").fill("13:00");
    await monday.getByLabel("cierra").first().fill("04:00");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByText("La hora de cierre tiene que ser después de la de apertura.").waitFor();
    await shot(`horario-error-${width}`);
    await page.goto(BASE + "/admin/contenido/productos");
    await page
      .getByRole("button", { name: /Borrar el producto/ })
      .first()
      .click();
    await page.getByRole("alertdialog").waitFor();
    await shot(`dialogo-${width}`);
    await page.getByRole("button", { name: "No, dejarlo" }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/admin");
  await page.getByRole("button", { name: "Más", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar", exact: true }).waitFor();
  await shot("mas-390");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.goto(BASE + "/admin/contenido/productos?q=sin-coincidencias-captura-local");
  await page.locator("main#contenido").waitFor();
  await shot("lista-vacia-390");
  await page.goto(BASE + "/admin/contenido/categorias/nueva");
  await page.getByRole("tab", { name: "Datos", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Captura local sin guardar");
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/admin/contenido/categorias/nueva", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await held;
    await route.abort();
  });
  try {
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("button", { name: "Guardando…", exact: true }).waitFor();
    await shot("guardando-390", "POST interceptado y abortado; ninguna categoría creada");
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  await page.goto(BASE + "/admin/clientes/nuevo");
  await page.setViewportSize({ width: 390, height: 500 });
  await page.locator("main input:not([type=hidden])").first().focus();
  await shot(
    "formulario-viewport-bajo-390",
    "Altura reducida y campo enfocado; simulación, no teclado físico",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.body.style.zoom = "2";
  });
  await shot(
    "formulario-zoom-css-200",
    "Zoom CSS al 200%; no equivale a zoom nativo del navegador",
  );
  await page.evaluate(() => {
    document.body.style.zoom = "";
  });
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    for (const role of ["administrador", "ingeniero", "repartidor"]) {
      const password = `Mock-${randomUUID()}-aA1!`;
      const email = `diseno-${role}-${Date.now()}@pimpos.test`;
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
      const context = await browser.newContext({
        locale: "es-PE",
        timezoneId: "America/Lima",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      if (role === "administrador")
        for (const width of [1440, 390])
          await capture(page, "login", "/ingresar", "sin-sesion", width);
      await page.goto(BASE + "/ingresar");
      await page.getByLabel("Correo", { exact: true }).fill(email);
      await page.getByLabel("Contraseña", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL(BASE + "/admin", { timeout: 45000 });
      await page.locator("main#contenido").waitFor({ timeout: 25000 });
      const routes =
        role === "administrador"
          ? [
              ["inicio", "/admin"],
              ["insumos", "/admin/insumos"],
              ["ingreso", "/admin/insumos/ingreso"],
              ["clientes", "/admin/clientes"],
              ["cliente-nuevo", "/admin/clientes/nuevo"],
              ["historial", "/admin/auditoria"],
              ["configuracion", "/admin/configuracion"],
              ["productos", "/admin/contenido/productos"],
              ["producto-nuevo", "/admin/contenido/productos/nuevo"],
            ]
          : role === "ingeniero"
            ? [
                ["inicio-ingeniero", "/admin"],
                ["insumos-ingeniero", "/admin/insumos"],
              ]
            : [
                ["inicio-repartidor", "/admin"],
                ["clientes-repartidor", "/admin/clientes"],
              ];
      for (const [name, route] of routes)
        for (const width of [1440, 390]) await capture(page, name, route, role, width);
      if (role === "administrador" && process.argv.includes("--estados")) await states(page);
      await context.close();
    }
  } finally {
    for (const id of users) await api(`/auth/v1/admin/users/${id}`, "DELETE");
    await browser.close();
    fs.writeFileSync(
      path.join(out, "limpieza.json"),
      JSON.stringify({ temporaryUsersRemoved: users.length, productionTouched: false }, null, 2),
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
