/* eslint-disable @typescript-eslint/no-require-imports -- Guion de captura local ejecutado como CommonJS por Node. */
const { chromium } = require("@playwright/test");
const { createHmac, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const BASE = "http://127.0.0.1:3000",
  API = "http://127.0.0.1:54321";
const root = path.resolve("DOC/Maquetas/comparacion-redisenio");
const out = path.join(root, "pantallas");
const css = fs.readFileSync(path.join(root, "propuestas.css"), "utf8");
const enc = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const data = `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ iss: "supabase-demo", role: "service_role", exp: 1983812996 })}`;
const key = `${data}.${createHmac("sha256", "super-secret-jwt-token-with-at-least-32-characters-long").update(data).digest("base64url")}`;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
async function api(route, method = "GET", body) {
  if (new URL(API).hostname !== "127.0.0.1") throw Error("Only localhost");
  const r = await fetch(API + route, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`Local API ${r.status}`);
  return r.json().catch(() => null);
}
const selected = process.argv[2]?.split(",");
const manifest = selected
  ? JSON.parse(fs.readFileSync(path.join(root, "comparacion.json"), "utf8")).filter(
      (x) => !selected.includes(x.name),
    )
  : [];
async function fingerprint(page) {
  return page.evaluate(() => ({
    inputs: [...document.querySelectorAll("main input, main select, main textarea")].map((e) => [
      e.tagName,
      e.type,
      e.name,
      e.id,
      e.required,
    ]),
    labels: [...document.querySelectorAll("main label")].map((e) => e.textContent),
    links: [...document.querySelectorAll("a")].map((e) => [
      e.getAttribute("href"),
      e.getAttribute("aria-label"),
      e.textContent,
    ]),
    buttons: [...document.querySelectorAll("button")].map((e) => [
      e.type,
      e.getAttribute("aria-label"),
      e.textContent,
    ]),
  }));
}
async function capture(page, name, route, width) {
  if (selected && !selected.includes(name)) return;
  // Deterministic opening-hours example for the public-home mock, not production time.
  if (name === "publico") await page.clock.setFixedTime(new Date("2026-10-07T09:00:00-05:00"));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
  if (route.startsWith("/admin")) await page.locator("main#contenido").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map((img) => {
        img.loading = "eager";
        return img.decode().catch(() => {});
      }),
    );
  });
  const photoSubstitutions = await page.evaluate(async () => {
    const replaced = [];
    for (const img of document.images) {
      if (img.complete && img.naturalWidth) continue;
      const file = /fachada/i.test(img.alt)
        ? "fachada1.webp"
        : /horno/i.test(img.alt)
          ? "horno1.webp"
          : null;
      if (!file) continue;
      img.removeAttribute("srcset");
      img.src = "/__mock-assets/" + file;
      img.loading = "eager";
      await img.decode().catch(() => {});
      replaced.push({ alt: img.alt, file });
    }
    return replaced;
  });
  const original = await fingerprint(page);
  await page.screenshot({ path: path.join(out, `${name}-${width}-actual.png`), fullPage: true });
  await page.addStyleTag({ content: css });
  await page.evaluate(() => {
    const html = document.documentElement;
    html.dataset.superficie =
      location.pathname === "/ingresar"
        ? "login"
        : location.pathname.startsWith("/admin")
          ? "panel"
          : "publico";
    const logo = () => {
      const img = new Image();
      img.src = "/__mock-assets/logo-512.webp";
      img.srcset =
        "/__mock-assets/logo-256.webp 256w, /__mock-assets/logo-512.webp 512w, /__mock-assets/logo-768.webp 768w";
      img.sizes = html.dataset.superficie === "login" ? "(max-width: 767px) 160px, 350px" : "160px";
      img.alt = "Panadería Pimpo’s";
      img.className = "propuesta-logo";
      return img;
    };
    if (html.dataset.superficie === "login") document.querySelector("main > div").prepend(logo());
    if (html.dataset.superficie === "publico") {
      document.querySelector('[aria-labelledby="titulo-madrugada"] > div:first-child')?.remove();
      html.dataset.tapiz = "on";
      const existing = document.querySelector('header a[href="/"] img');
      if (existing) {
        const replacement = logo();
        replacement.alt = existing.alt;
        replacement.sizes = "72px";
        existing.parentElement.classList.add("propuesta-logo-publico");
        existing.replaceWith(replacement);
      }
      document.querySelector("footer > div > div")?.prepend(logo());
    }
    if (html.dataset.superficie === "panel") {
      document.querySelector("aside > p")?.prepend(logo());
      const header = document.createElement("div");
      header.className = "propuesta-marca-movil";
      header.append(logo(), document.createTextNode("Panel de gestión"));
      document.querySelector("main#contenido").before(header);
      const heading = [...document.querySelectorAll("h2")].find((e) =>
        e.textContent.includes("Tus secciones"),
      );
      heading?.nextElementSibling?.classList.add("propuesta-secciones");
    }
  });
  for (const direction of ["a"]) {
    await page.evaluate((d) => (document.documentElement.dataset.propuesta = d), direction);
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images]
          .filter((i) => i.classList.contains("propuesta-logo"))
          .map((i) => i.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: path.join(out, `${name}-${width}-${direction}.png`),
      fullPage: true,
    });
    if (["publico", "catalogo"].includes(name)) {
      await page.evaluate(() => (document.documentElement.dataset.tapiz = "off"));
      await page.screenshot({
        path: path.join(out, `${name}-${width}-a-liso.png`),
        fullPage: true,
      });
      await page.evaluate(() => (document.documentElement.dataset.tapiz = "on"));
      if (name === "publico") {
        await page.evaluate(() =>
          window.scrollTo(
            0,
            document.querySelector('[aria-labelledby="titulo-madrugada"]').offsetTop - 220,
          ),
        );
        await page.screenshot({
          path: path.join(root, `tapiz-${width}-vista.png`),
          fullPage: false,
        });
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    }
    const after = await fingerprint(page);
    if (name === "publico" && width === 390)
      await page.screenshot({ path: path.join(root, "portada-movil-vista.png"), fullPage: false });
    const paletteChecks = [];
    const scanBlue = async (state) => {
      const matches = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const blue = (value) => {
          if (!value || ["none", "transparent", "auto"].includes(value)) return false;
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = "#000";
          ctx.fillStyle = value;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          return a > 0 && b > r + 8 && b > g + 3;
        };
        const found = [];
        for (const el of document.querySelectorAll("body *")) {
          if (!el.getBoundingClientRect().width || getComputedStyle(el).visibility === "hidden")
            continue;
          const style = getComputedStyle(el);
          for (const property of [
            "color",
            "backgroundColor",
            "borderTopColor",
            "borderRightColor",
            "borderBottomColor",
            "borderLeftColor",
            "outlineColor",
            "textDecorationColor",
            "fill",
            "stroke",
          ]) {
            if (blue(style[property]))
              found.push({ tag: el.tagName, property, value: style[property] });
          }
        }
        return found;
      });
      paletteChecks.push({ state, blueValues: matches });
    };
    await scanBlue("normal");
    const candidates = page.locator("a:visible,button:visible,input:visible,select:visible");
    const signatures = new Set();
    for (let i = 0; i < (await candidates.count()); i++) {
      const control = candidates.nth(i);
      const signature = await control.evaluate((e) => e.tagName + "|" + e.className);
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      await control.hover({ force: true });
      await control.focus();
      await scanBlue("hover-focus-" + signatures.size);
    }
    await page.mouse.move(0, 0);
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      logoVisible: [...document.querySelectorAll(".propuesta-logo")].some(
        (e) => e.getBoundingClientRect().width > 0 && e.complete && e.naturalWidth > 0,
      ),
      veilHidden: [...document.querySelectorAll(".velo-hero")].every(
        (e) => getComputedStyle(e).display === "none",
      ),
      brokenVisibleImages: [...document.images]
        .filter((e) => e.getBoundingClientRect().width > 0 && (!e.complete || !e.naturalWidth))
        .map((e) => e.alt),
    }));
    if (JSON.stringify(original) !== JSON.stringify(after)) {
      const differences = Object.keys(original)
        .filter((k) => JSON.stringify(original[k]) !== JSON.stringify(after[k]))
        .map((k) => ({ kind: k, before: original[k], after: after[k] }));
      fs.writeFileSync(
        path.join(root, "paridad-diagnostico.json"),
        JSON.stringify({ name, differences }, null, 2),
      );
      throw Error(`Controls changed: ${name}; see paridad-diagnostico.json`);
    }
    if (metrics.scrollWidth > width) throw Error(`Overflow: ${name} ${direction} ${width}`);
    manifest.push({
      name,
      route,
      width,
      direction,
      controlsUnchanged: true,
      paletteChecks,
      photoSubstitutions,
      ...metrics,
    });
    fs.writeFileSync(path.join(root, "comparacion.json"), JSON.stringify(manifest, null, 2));
    console.log(`${name} ${width} ${direction}: same controls, width=${metrics.scrollWidth}`);
  }
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const context = await browser.newContext({
    locale: "es-PE",
    timezoneId: "America/Lima",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.route("**/__mock-assets/*", (route) => {
    const file = new URL(route.request().url()).pathname.split("/").pop();
    if (file === "tapiz-panaderia.svg")
      return route.fulfill({ path: path.join(root, "assets", file), contentType: "image/svg+xml" });
    if (["logo-256.webp", "logo-512.webp", "logo-768.webp"].includes(file))
      return route.fulfill({ path: path.join(root, "assets", file), contentType: "image/webp" });
    if (!["fachada1.webp", "horno1.webp"].includes(file)) return route.abort();
    return route.fulfill({
      path: path.resolve("DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/lugar", file),
      contentType: "image/webp",
    });
  });
  let user;
  try {
    for (const [name, route] of [
      ["publico", "/"],
      ["catalogo", "/productos"],
      ["login", "/ingresar"],
    ])
      for (const width of [1440, 390]) await capture(page, name, route, width);
    // Public/login-only refinements do not need a temporary account or database.
    if (selected && selected.every((name) => ["publico", "catalogo", "login"].includes(name)))
      return;
    const password = `Mock-${randomUUID()}-aA1!`,
      email = `maquetas-${Date.now()}@pimpos.test`;
    user = await api("/auth/v1/admin/users", "POST", { email, password, email_confirm: true });
    await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
      rol: "administrador",
      nombre_completo: "Diseño local",
      activo: true,
    });
    await page.goto(BASE + "/ingresar");
    await page.getByLabel("Correo", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(BASE + "/admin", { timeout: 45000 });
    for (const [name, route] of [
      ["inicio", "/admin"],
      ["insumos", "/admin/insumos"],
      ["ingreso", "/admin/insumos/ingreso"],
      ["cliente-nuevo", "/admin/clientes/nuevo"],
      ["historial", "/admin/auditoria"],
      ["configuracion", "/admin/configuracion"],
      ["producto-nuevo", "/admin/contenido/productos/nuevo"],
    ])
      for (const width of [1440, 390]) await capture(page, name, route, width);
  } finally {
    if (user) await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
    await browser.close();
    fs.writeFileSync(
      path.join(root, "limpieza-maquetas.json"),
      JSON.stringify({ temporaryUsersRemoved: user ? 1 : 0, productionTouched: false }, null, 2),
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
