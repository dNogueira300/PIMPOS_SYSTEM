/* eslint-disable @typescript-eslint/no-require-imports -- Estilos calculados y estados de controles del build local, sin activar acciones. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!API || new URL(API).hostname !== "127.0.0.1" || !KEY) throw Error("Solo local.");
const out = path.resolve("DOC/Maquetas/3.2/bloque5/estados");
fs.mkdirSync(out, { recursive: true });
const records = [];
async function api(route, method, body) {
  const r = await fetch(API + route, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error(`API local ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
async function inspect(locator, route, state) {
  records.push(
    await locator.evaluate(
      (el, args) => {
        const styles = [null, "::before", "::after"].flatMap((pseudo) => {
          const style = getComputedStyle(el, pseudo);
          return [
            "color",
            "backgroundColor",
            "borderTopColor",
            "outlineColor",
            "fill",
            "stroke",
          ].map((property) => ({ pseudo, property, value: style[property] }));
        });
        const blue = styles.filter(({ value }) => {
          const m = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m && +m[3] > +m[1] + 20 && +m[3] > +m[2] + 10;
        });
        return {
          ...args,
          tag: el.tagName,
          name:
            el.getAttribute("aria-label") ||
            el.getAttribute("name") ||
            el.textContent?.trim().slice(0, 80),
          styles,
          blue,
          disabled: Boolean(el.disabled),
        };
      },
      { route, state },
    ),
  );
}
(async () => {
  const browser = await chromium.launch();
  let user;
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const routes = [
      "/ingresar",
      "/",
      "/galeria",
      "/nosotros",
      "/admin/contenido/productos/nuevo",
      "/admin/insumos/nuevo",
      "/admin/insumos/ingreso",
      "/admin/clientes/nuevo",
      "/admin/configuracion",
      "/admin/auditoria",
    ];
    for (const route of routes) {
      if (route.startsWith("/admin") && !user) {
        const email = `cierre-estados-${Date.now()}@pimpos.test`,
          password = "PruebaDeEstados2026";
        user = await api("/auth/v1/admin/users", "POST", { email, password, email_confirm: true });
        await api(`/rest/v1/perfiles?id=eq.${user.id}`, "PATCH", {
          rol: "administrador",
          nombre_completo: "Prueba de estados",
          activo: true,
        });
        await page.goto("http://localhost:3000/ingresar");
        await page.getByLabel("Correo", { exact: true }).fill(email);
        await page.getByLabel("Contraseña", { exact: true }).fill(password);
        await page.getByRole("button", { name: "Entrar", exact: true }).click();
        await page.waitForURL("**/admin");
      }
      await page.goto("http://localhost:3000" + route);
      await page.locator("main h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      const controls = page.locator(
        "button:visible,a:visible,input:visible,select:visible,textarea:visible",
      );
      const seen = new Set();
      for (const control of await controls.all()) {
        const key = await control.evaluate(
          (el) => el.tagName + ":" + el.className + ":" + Boolean(el.disabled),
        );
        if (seen.has(key)) continue;
        seen.add(key);
        await inspect(control, route, "normal");
        if (await control.isEnabled()) {
          // El salto al contenido es sr-only hasta recibir foco: primero
          // enfocarlo permite comprobar su hover sin forzar eventos ocultos.
          await control.focus();
          await inspect(control, route, "focus");
          await control.hover();
          await inspect(control, route, "hover");
        }
      }
    }
    await page.goto("http://localhost:3000/");
    await page.emulateMedia({ media: "print" });
    await page.screenshot({ path: path.join(out, "portada-impresion.png"), fullPage: true });
  } finally {
    if (user) await api(`/auth/v1/admin/users/${user.id}`, "DELETE");
    await browser.close();
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          records,
          method:
            "Una muestra por clase/tipo/disabled en cada ruta, normal/hover/focus y pseudo-elementos; las capturas generales amplían la lectura normal a todas las rutas",
          cleanup: { productionTouched: false, userRemoved: Boolean(user) },
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (records.some((r) => r.blue.length)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
