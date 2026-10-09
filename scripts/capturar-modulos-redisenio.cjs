/* eslint-disable @typescript-eslint/no-require-imports -- Evidencia autenticada exclusivamente local. */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = "http://127.0.0.1:3000";
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY)
  throw Error("Ejecutar con el entorno de pruebas de Supabase local; producción prohibida.");
const out = path.resolve(process.argv[2] ?? "DOC/Maquetas/3.2/bloque2");
const mode = process.argv.includes("--t3") ? "t3" : "t4";
const completing = process.argv.includes("--completar-t3");
const previous = completing
  ? JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"))
  : null;
const users = [];
const products = [];
const clients = [];
const news = [];
const records = previous?.records ?? [];
const skipped = [];
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
function walk(p) {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .flatMap((x) => (x.isDirectory() ? walk(path.join(p, x.name)) : [path.join(p, x.name)]));
}
const root = "src/app/(admin)/admin";
const templates = walk(root)
  .filter((p) => p.endsWith("page.tsx"))
  .map((p) => "/admin/" + path.relative(root, path.dirname(p)).replaceAll("\\", "/"))
  .map((p) => p.replace(/\/$/, ""))
  .filter((p) =>
    mode === "t3"
      ? !/^\/admin\/(?:insumos|clientes)(?:\/|$)/.test(p)
      : /^\/admin\/(?:insumos|clientes)(?:\/|$)/.test(p),
  );
const selectedTemplates = completing ? ["/admin/contenido/novedades/[id]"] : templates;
const tables = {
  "/admin/contenido/categorias": "categorias_producto",
  "/admin/contenido/productos": "productos",
  "/admin/contenido/novedades": "novedades",
  "/admin/contenido/portada": "slides",
  "/admin/contenido/galeria": "galeria",
  "/admin/contenido/preguntas": "faqs",
  "/admin/contenido/guias": "guias",
  "/admin/contenido/testimonios": "testimonios",
  "/admin/clientes/zonas": "zonas_reparto",
  "/admin/clientes": "clientes",
  "/admin/insumos/proveedores": "proveedores",
  "/admin/insumos": "insumos",
};
const ids = {};
async function productFixture(email, password) {
  // Mismo guardar_producto y contrato utilizados por panel-historial.spec.ts.
  const auth = await api("/auth/v1/token?grant_type=password", "POST", { email, password });
  const rpc = async (body) => {
    const r = await fetch(API + "/rest/v1/rpc/guardar_producto", {
      method: "POST",
      headers: { ...headers, Authorization: `Bearer ${auth.access_token}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw Error(`Fixture local de producto: ${r.status}`);
    return r.json();
  };
  const marca = Date.now();
  const producto = {
    categoria_id: await idFor("/admin/contenido/categorias"),
    nombre: `Pan de evidencia ${marca}`,
    slug: `pan-de-evidencia-${marca}`,
    descripcion: "Producto temporal para revisar la presentación y su historial.",
    destacado: false,
    estado: "borrador",
  };
  const presentaciones = [
    { nombre: "Unidad", precio: 0.2, unidad_venta: "unidad" },
    { nombre: "Media docena", precio: 1.2, unidad_venta: "paquete" },
    { nombre: "Docena", precio: 2.4, unidad_venta: "paquete" },
  ];
  const id = await rpc({ p_producto: producto, p_presentaciones: presentaciones });
  products.push(id);
  ids["/admin/contenido/productos"] = id;
  const variantes = await api(
    `/rest/v1/producto_variantes?producto_id=eq.${id}&select=id,nombre,precio,unidad_venta&order=orden`,
  );
  await rpc({
    p_producto: {
      ...producto,
      id,
      descripcion:
        "Pan artesanal. Se ofrece por unidad, media docena o docena. Este registro temporal permite revisar varios cambios juntos en el historial sin modificar productos del negocio.",
    },
    p_presentaciones: variantes.map((v) => ({ ...v, precio: Number(v.precio) + 0.1 })),
  });
  const r = await fetch(API + "/rest/v1/novedades", {
    method: "POST",
    headers: {
      ...headers,
      Authorization: `Bearer ${auth.access_token}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      tipo: "aviso",
      titulo: `Aviso de evidencia ${marca}`,
      slug: `aviso-evidencia-${marca}`,
      contenido: "Registro temporal para comprobar el formulario de edición. No está publicado.",
      estado: "borrador",
    }),
  });
  if (!r.ok) throw Error(`Fixture local de novedad: ${r.status}`);
  const [notice] = await r.json();
  news.push(notice.id);
  ids["/admin/contenido/novedades"] = notice.id;
}
async function idFor(prefix) {
  if (ids[prefix]) return ids[prefix];
  const rows = await api(`/rest/v1/${tables[prefix]}?select=id&deleted_at=is.null&limit=1`);
  ids[prefix] = rows[0]?.id;
  return ids[prefix];
}
async function clientFixture(email, password) {
  // Fixture equivalente a crearClienteDePrueba; cliente y permiso en el mismo RPC.
  const auth = await api("/auth/v1/token?grant_type=password", "POST", { email, password });
  const zones = await api("/rest/v1/zonas_reparto?select=id&activo=eq.true&limit=1");
  const r = await fetch(API + "/rest/v1/rpc/registrar_cliente", {
    method: "POST",
    headers: { ...headers, Authorization: `Bearer ${auth.access_token}` },
    body: JSON.stringify({
      p_cliente: {
        nombre_completo: `Cliente de evidencia ${Date.now()}`,
        celular: `9${String(Date.now()).slice(-8)}`,
        direccion: "Jirón Próspero 100",
        referencia: "Portón verde",
        zona_id: zones[0].id,
        latitud: -3.747321,
        longitud: -73.251114,
      },
      p_version_texto: "v1-2026-10",
    }),
  });
  if (!r.ok) throw Error(`Fixture local de cliente: ${r.status}`);
  const id = await r.json();
  clients.push(id);
  ids["/admin/clientes"] = id;
}
async function shot(page, name, requested, role, width, options = {}) {
  if (!options.current) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(BASE + requested, { waitUntil: "domcontentloaded", timeout: 45000 });
  }
  await page.locator("main#contenido h1").waitFor({ state: "visible" });
  await page
    .locator("main")
    .getByText(/^Cargando…$/)
    .waitFor({ state: "hidden" });
  const mapRequested =
    /^\/admin\/clientes\/[a-f0-9-]{36}(?:\/corregir)?$/.test(requested) ||
    name.startsWith("cliente-correccion") ||
    name.startsWith("cliente-ubicacion") ||
    name.startsWith("clientes-mapa");
  if (mapRequested)
    await page.locator(".leaflet-container:visible").first().waitFor({ state: "visible" });
  for (const map of await page.locator(".leaflet-container:visible").all()) {
    // Los panes son contenedores absolutos sin dimensiones propias. La
    // atribución visible y las teselas insertadas confirman la inicialización.
    await map.locator(".leaflet-control-attribution").waitFor({ state: "visible" });
    await map.locator(".leaflet-tile").first().waitFor({ state: "attached" });
  }
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".leaflet-container img")]
      .filter((i) => i.getClientRects().length)
      .every((i) => i.complete),
  );
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("img:visible")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode().catch(() => undefined))));
  const measured = await page.evaluate(() => ({
    route: location.pathname + location.search,
    width: innerWidth,
    height: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector("main h1")?.textContent,
    controls: [...document.querySelectorAll("main,[role=dialog],[role=alertdialog]")]
      .flatMap((container) => [
        ...container.querySelectorAll("input:not([type=hidden]),textarea,select,button,a"),
      ])
      .filter((e) => e.getClientRects().length)
      .map((e) => ({
        name: e.getAttribute("name") ?? e.getAttribute("aria-label") ?? e.textContent,
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
      })),
    images: [...document.images]
      .filter((i) => i.getClientRects().length)
      .map((i) => ({ alt: i.alt, loaded: i.complete && i.naturalWidth > 0 })),
    blueStyles: [
      ...document.querySelectorAll("main *,aside *,header *,[role=dialog] *,[role=alertdialog] *"),
    ]
      .filter((e) => e.getClientRects().length)
      .flatMap((e) =>
        ["color", "backgroundColor", "borderTopColor", "outlineColor", "fill", "stroke"].flatMap(
          (property) => {
            const value = getComputedStyle(e)[property],
              m = value.match(/^rgba?\((\d+), (\d+), (\d+)/);
            if (!m) return [];
            const [r, g, b] = m.slice(1).map(Number);
            return b > r + 20 && b > g + 10 ? [{ tag: e.tagName, property, value }] : [];
          },
        ),
      ),
  }));
  const fullPage = options.fullPage ?? true;
  await page.screenshot({ path: path.join(out, name + ".png"), fullPage });
  const axe = await new AxeBuilder({ page }).analyze();
  const item = {
    name,
    requested,
    role,
    ...measured,
    fullPage,
    axe: axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    note: options.note,
  };
  const priorIndex = records.findIndex((record) => record.name === name);
  if (priorIndex >= 0) records[priorIndex] = item;
  else records.push(item);
  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify({ mode, records, skipped }, null, 2),
  );
  const bad =
    measured.scrollWidth > measured.width ||
    measured.blueStyles.length ||
    axe.violations.length ||
    measured.images.some((i) => !i.loaded);
  if (bad) process.exitCode = 1;
  console.log(
    `${name}: width=${measured.scrollWidth}/${measured.width}, axe=${axe.violations.length}, azul=${measured.blueStyles.length}`,
  );
}
async function specialT3(page, userId) {
  for (const width of [375, 768, 1024])
    await shot(page, `inicio-${width}`, "/admin", "administrador", width);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(BASE + `/admin/auditoria?cuando=todo&seccion=productos&persona=${userId}`, {
      waitUntil: "domcontentloaded",
    });
    const extensive = await page
      .locator("a[data-cambio]")
      .filter({ hasText: /creó el producto/ })
      .first()
      .getAttribute("href");
    if (!extensive) throw Error("No se encontró el alta de evidencia en el historial local.");
    await shot(page, `historial-registro-extenso-${width}`, extensive, "administrador", width);
    await page.goto(BASE + `/admin/contenido/productos/${ids["/admin/contenido/productos"]}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("tab", { name: "Precios", exact: true }).click();
    await shot(
      page,
      `producto-unidades-guardadas-${width}`,
      page.url().slice(BASE.length),
      "administrador",
      width,
      { current: true, note: "Tres presentaciones del fixture con su historial de precios real." },
    );
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(BASE + "/admin/contenido/productos/nuevo", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "Precios", exact: true }).click();
    await page.getByRole("button", { name: "Otra presentación", exact: true }).click();
    await page.getByRole("button", { name: "Otra presentación", exact: true }).click();
    for (const [i, name] of ["Unidad", "Media docena", "Docena"].entries()) {
      await page.getByLabel(`Presentación ${i + 1}`, { exact: true }).fill(name);
      await page
        .getByLabel("Precio (S/)", { exact: true })
        .nth(i)
        .fill(["0.20", "1.20", "2.40"][i]);
    }
    await shot(
      page,
      `presentaciones-${width}`,
      "/admin/contenido/productos/nuevo",
      "administrador",
      width,
      { current: true, note: "Tres presentaciones sin guardar; no se crea producto." },
    );
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByText("Escribe el nombre del producto.", { exact: true }).waitFor();
    await shot(
      page,
      `error-otra-pestana-${width}`,
      "/admin/contenido/productos/nuevo",
      "administrador",
      width,
      { current: true, note: "Validación local; retorna a Datos sin enviar POST." },
    );
    await page.goto(BASE + "/admin/configuracion", { waitUntil: "domcontentloaded" });
    for (const tab of ["Horarios", "Marca"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await shot(
        page,
        `configuracion-${tab.toLowerCase()}-${width}`,
        "/admin/configuracion",
        "administrador",
        width,
        { current: true },
      );
    }
    await page.goto(BASE + "/admin/contenido/productos?q=SinResultadoDiseno999999", {
      waitUntil: "domcontentloaded",
    });
    await shot(
      page,
      `lista-vacia-${width}`,
      "/admin/contenido/productos?q=SinResultadoDiseno999999",
      "administrador",
      width,
      { current: true },
    );
  }
}
async function specialT4(page, role) {
  const clientId = await idFor("/admin/clientes");
  if (role === "repartidor" && clientId) {
    for (const width of [390, 1440])
      await shot(
        page,
        `cliente-correccion-repartidor-${width}`,
        `/admin/clientes/${clientId}/corregir`,
        role,
        width,
      );
    return;
  }
  if (role !== "administrador") return;
  for (const width of [375, 768, 1024])
    for (const [name, route] of [
      ["insumos", "/admin/insumos"],
      ["clientes", "/admin/clientes"],
      ["existencias", "/admin/insumos/reportes/existencias"],
    ])
      await shot(page, `${name}-${width}`, route, role, width);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(BASE + "/admin/insumos/ingreso", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Añadir otro insumo", exact: true }).click();
    await shot(page, `ingreso-varias-lineas-${width}`, "/admin/insumos/ingreso", role, width, {
      current: true,
      note: "Líneas sin guardar; no se registra un movimiento.",
    });
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.locator("[data-linea] [aria-invalid=true]").first().waitFor();
    await shot(page, `ingreso-error-${width}`, "/admin/insumos/ingreso", role, width, {
      current: true,
      note: "Validación local de líneas vacías, sin POST.",
    });
    await page.goto(BASE + "/admin/clientes/nuevo", { waitUntil: "domcontentloaded" });
    for (const tab of ["Ubicación y fotos", "Permiso"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await shot(
        page,
        `cliente-${tab === "Permiso" ? "permiso" : "ubicacion"}-${width}`,
        "/admin/clientes/nuevo",
        role,
        width,
        { current: true },
      );
    }
    await page.goto(BASE + "/admin/clientes?vista=mapa", { waitUntil: "domcontentloaded" });
    await shot(page, `clientes-mapa-${width}`, "/admin/clientes?vista=mapa", role, width, {
      current: true,
    });
    await page.goto(BASE + "/admin/clientes?q=SinResultadoDiseno999999", {
      waitUntil: "domcontentloaded",
    });
    await shot(
      page,
      `clientes-vacio-${width}`,
      "/admin/clientes?q=SinResultadoDiseno999999",
      role,
      width,
      { current: true },
    );
    if (clientId) {
      await page.goto(BASE + `/admin/clientes/${clientId}`, { waitUntil: "domcontentloaded" });
      const erase = page.getByRole("button", { name: /^Borrar sus datos:/ });
      await erase.waitFor({ state: "visible" });
      await erase.click();
      await page.getByRole("alertdialog").waitFor();
      await shot(
        page,
        `cliente-dialogo-borrado-${width}`,
        `/admin/clientes/${clientId}`,
        role,
        width,
        {
          current: true,
          fullPage: false,
          note: "Diálogo en el viewport real y cancelado; no se borra ningún cliente.",
        },
      );
      await page.getByRole("button", { name: "No, dejarlo", exact: true }).click();
    }
  }
  for (const route of ["/admin/insumos/ingreso", "/admin/clientes/nuevo"]) {
    await page.setViewportSize({ width: 390, height: 500 });
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.locator("main input:not([type=hidden])").first().focus();
    const name = route.includes("insumos") ? "ingreso" : "cliente";
    await shot(page, `${name}-altura-reducida`, route, role, 390, {
      current: true,
      note: "Altura reducida con foco; no equivale a teclado físico.",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });
    await shot(page, `${name}-zoom-css-200`, route, role, 1440, {
      current: true,
      note: "Simulación CSS del aumento al 200 %, no zoom nativo.",
    });
    await page.evaluate(() => {
      document.body.style.zoom = "";
    });
  }
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  try {
    const roles =
      mode === "t3" ? ["administrador", "ingeniero"] : ["administrador", "ingeniero", "repartidor"];
    for (const role of roles) {
      const password = `Mock-${randomUUID()}-aA1!`,
        email = `diseno-modulos-${Date.now()}-${role}@pimpos.test`;
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
      await page.goto(BASE + "/ingresar");
      await page.getByLabel("Correo", { exact: true }).fill(email);
      await page.getByLabel("Contraseña", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL(BASE + "/admin", { timeout: 45000 });
      if (role === "administrador" && mode === "t3") await productFixture(email, password);
      if (role === "administrador" && mode === "t4") await clientFixture(email, password);
      const roleTemplates =
        role === "administrador"
          ? selectedTemplates
          : mode === "t3"
            ? ["/admin/contenido/novedades"]
            : role === "ingeniero"
              ? ["/admin/insumos", "/admin/insumos/ingreso", "/admin/insumos/consumo"]
              : ["/admin/clientes"];
      for (const template of roleTemplates) {
        let routes = [template];
        if (template.includes("[reporte]"))
          routes = ["existencias", "consumo", "compras", "mermas", "kardex"].map((s) =>
            template.replace("[reporte]", s),
          );
        if (template.includes("[id]")) {
          const prefix = template.split("/[id]")[0];
          let id;
          if (prefix === "/admin/usuarios") id = user.id;
          else if (prefix === "/admin/auditoria") {
            await page.goto(
              BASE + `/admin/auditoria?cuando=todo&seccion=productos&persona=${user.id}`,
              { waitUntil: "domcontentloaded" },
            );
            id = (await page.locator("a[data-cambio]").first().getAttribute("href"))
              ?.split("/")
              .at(-1);
          } else id = await idFor(prefix);
          if (!id) {
            skipped.push({ template, reason: "Sin registro local disponible" });
            continue;
          }
          routes = [template.replace("[id]", id)];
        }
        for (const route of routes)
          for (const width of process.argv.includes("--cierre")
            ? [375, 390, 768, 1024, 1440]
            : [390, 1440]) {
            const name =
              (template === "/admin" ? "inicio" : template.slice(7))
                .replaceAll("/", "-")
                .replace("[id]", "detalle")
                .replace("[reporte]", route.split("/").at(-1)) + `-${role}-${width}`;
            await shot(page, name, route, role, width);
          }
      }
      if (role === "administrador" && mode === "t3") await specialT3(page, user.id);
      if (mode === "t4") await specialT4(page, role);
      await context.close();
    }
  } finally {
    const cleanupErrors = [];
    async function removeAll(items, route) {
      let removed = 0;
      for (const id of items) {
        try {
          await api(route(id), "DELETE");
          removed++;
        } catch (e) {
          cleanupErrors.push(e.message);
        }
      }
      return removed;
    }
    const clientsRemoved = await removeAll(clients, (id) => `/rest/v1/clientes?id=eq.${id}`);
    const productsRemoved = await removeAll(products, (id) => `/rest/v1/productos?id=eq.${id}`);
    const newsRemoved = await removeAll(news, (id) => `/rest/v1/novedades?id=eq.${id}`);
    const usersRemoved = await removeAll(users, (id) => `/auth/v1/admin/users/${id}`);
    await browser.close().catch((e) => cleanupErrors.push(e.message));
    fs.writeFileSync(
      path.join(out, "limpieza.json"),
      JSON.stringify(
        {
          temporaryUsersCreated: users.length,
          temporaryUsersRemoved: usersRemoved,
          productionTouched: false,
          temporaryProductsCreated: products.length,
          temporaryProductsRemoved: productsRemoved,
          temporaryClientsCreated: clients.length,
          temporaryClientsRemoved: clientsRemoved,
          temporaryNewsCreated: news.length,
          temporaryNewsRemoved: newsRemoved,
          businessRecordsModified: false,
          cleanupErrors,
        },
        null,
        2,
      ),
    );
    if (cleanupErrors.length) throw Error(`Limpieza local incompleta: ${cleanupErrors.join("; ")}`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
