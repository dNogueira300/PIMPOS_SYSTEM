import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

import { sqlLocal } from "./ayudas/base";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Navidad en el sitio público (plan 08, T4), con sus dos estilos.
 *
 * Una temática viste el sitio ENTERO, así que estas pruebas no pueden correr a
 * la vez que las del sitio público (varias miran colores): van en el proyecto
 * `tematicas`, que Playwright corre cuando `movil` y `escritorio` terminaron
 * (ver playwright.config.ts). Se enciende desde el panel y no por SQL: el sitio
 * está en caché y solo el «Guardar» del panel la refresca.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
/** «2026-11-25»: hoy en Iquitos más `dias`. */
function dia(dias: number): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000 + dias * DIA_MS).toISOString().slice(0, 10);
}

const NORMAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];
const SIN_ANIMACION = "*,*::before,*::after{animation:none!important;transition:none!important}";

async function exigirCeroAxe(page: Page, donde: string) {
  await page.addStyleTag({ content: SIN_ANIMACION });
  const { violations } = await new AxeBuilder({ page }).withTags(NORMAS).analyze();
  const fallos = violations.map(
    (v) =>
      `[${v.id}] ${v.help}: ${v.nodes
        .slice(0, 3)
        .map((n) => String(n.target))
        .join(", ")}`,
  );
  expect(fallos, `axe en ${donde}:\n${fallos.join("\n")}`).toEqual([]);
}

/** axe en las páginas públicas con la temática puesta, en escritorio. */
async function axeEnEscritorio(browser: Browser, estilo: string) {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await contexto.newPage();
  try {
    for (const ruta of ["/", "/productos", "/productos/frances-chico", "/contacto"]) {
      await page.goto(ruta);
      await exigirCeroAxe(page, `${ruta} en escritorio (${estilo})`);
    }
  } finally {
    await contexto.close();
  }
}

/** Abre la temática en el panel, aplica `cambiar` y guarda. */
async function guardarNavidad(page: Page, cambiar: () => Promise<void>) {
  await page.goto("/admin/contenido/tematicas/navidad");
  await cambiar();
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL("/admin/contenido/tematicas");
}

test("Navidad viste el sitio, con sus dos estilos, y al apagarla vuelve a como estaba", async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  const slug = `paneton-e2e-${Date.now()}`;
  const nombre = `Panetón E2E ${slug.slice(-6)}`;
  // Lo de fábrica que se toca, para dejarlo como estaba.
  const antes = sqlLocal(
    `select concat_ws('|', inicio, fin, fecha_evento, estilo) from public.tematicas where slug = 'navidad'`,
  ).trim();
  const [inicio, fin, evento, estilo] = antes.split("|");
  const aviso = sqlLocal(`select texto_aviso from public.tematicas where slug = 'navidad'`).trim();
  const mensaje = sqlLocal(
    `select mensajes_cinta[1] from public.tematicas where slug = 'navidad'`,
  ).trim();

  sqlLocal(`
    insert into public.productos (categoria_id, nombre, slug, estado)
    select id, '${nombre}', '${slug}', 'publicado' from public.categorias_producto
     where deleted_at is null order by orden limit 1;
    insert into public.producto_variantes (producto_id, nombre, precio, unidad_venta, es_predeterminada)
    select id, 'Unidad', 14, 'unidad', true from public.productos where slug = '${slug}';
    insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
    select t.id, p.id, true, 0 from public.tematicas t, public.productos p
     where t.slug = 'navidad' and p.slug = '${slug}';
  `);
  const usuario = await entrarComo(page, "administrador");
  try {
    // Encendida a mano, con la fiesta dentro de 12 días.
    await guardarNavidad(page, async () => {
      const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
      await cuando.getByLabel("Empieza el").fill(dia(5));
      await cuando.getByLabel("Termina el").fill(dia(30));
      await cuando.getByLabel("Fecha de Navidad").fill(dia(12));
      await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
      await page.getByRole("tab", { name: "Estilo" }).click();
      await page
        .getByRole("tabpanel", { name: "Estilo" })
        .getByRole("radio", { name: /Noche de Navidad/ })
        .check();
    });

    await page.goto("/");
    await expect(page.locator('[data-tematica="navidad"][data-estilo="noche"]')).toHaveCount(1);
    await expect(page.getByRole("complementary", { name: "Campaña de temporada" })).toContainText(
      aviso,
    );
    await expect(page.getByRole("region", { name: "Mensajes de Navidad" })).toContainText(mensaje);
    const seccion = page.locator("[data-seccion-temporada]");
    await expect(seccion.getByRole("heading", { level: 2 })).toContainText("Navidad");
    await expect(seccion.locator("[data-cuenta-regresiva]")).toHaveText(
      "Faltan 12 días para Navidad",
    );
    await expect(seccion.getByText(nombre)).toBeVisible();
    // La sección va antes de «Lo que horneamos hoy».
    const orden = await page.evaluate(() => {
      const temporada = document.querySelector("[data-seccion-temporada]");
      const hoy = document.getElementById("titulo-horneamos");
      return Boolean(
        temporada &&
        hoy &&
        temporada.compareDocumentPosition(hoy) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(orden).toBe(true);
    // Los adornos no se quedan con los clics: el enlace de la ficha recibe el
    // puntero (la comprobación de Playwright mira qué elemento hay en ese punto).
    await seccion.getByRole("link", { name: nombre }).click({ trial: true });

    // La cinta: se desliza, y con «menos movimiento» se queda quieta y la copia
    // del bucle no sale. Al imprimir, la nieve no sale.
    const pista = page.locator(".cinta-tematica__pista");
    await expect(pista).toHaveCSS("animation-name", "cinta-avanza");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(pista).toHaveCSS("animation-name", "none");
    await expect(page.locator(".cinta-tematica ul[aria-hidden]")).toBeHidden();
    await page.emulateMedia({ reducedMotion: null, media: "print" });
    const nieve = await page.evaluate(() => {
      const envoltura = document.querySelector("[data-tematica]");
      return envoltura ? getComputedStyle(envoltura, "::before").display : "sin envoltura";
    });
    expect(nieve).toBe("none");
    await page.emulateMedia({ media: null });

    // axe con Navidad, a 375 px, con el menú abierto y en escritorio.
    await page.goto("/");
    await exigirCeroAxe(page, "la portada a 375 px (noche)");
    await page.getByRole("button", { name: "Abrir el menú" }).click();
    await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();
    await exigirCeroAxe(page, "el menú del celular (noche)");
    await page.goto(`/productos/${slug}`);
    await exigirCeroAxe(page, "la ficha del producto de temporada (noche)");
    await axeEnEscritorio(browser, "noche");

    // El otro estilo.
    await guardarNavidad(page, async () => {
      await page.getByRole("tab", { name: "Estilo" }).click();
      await page
        .getByRole("tabpanel", { name: "Estilo" })
        .getByRole("radio", { name: /Crema navideña/ })
        .check();
    });
    await page.goto("/");
    await expect(page.locator('[data-tematica="navidad"][data-estilo="crema"]')).toHaveCount(1);
    await exigirCeroAxe(page, "la portada a 375 px (crema)");
    await axeEnEscritorio(browser, "crema");

    // Según fechas, con la campaña por llegar: el sitio vuelve a como estaba.
    await guardarNavidad(page, async () => {
      await page
        .getByRole("tabpanel", { name: "Cuándo" })
        .getByRole("radio", { name: /Según fechas/ })
        .check();
    });
    await page.goto("/");
    await expect(page.locator("[data-tematica]")).toHaveCount(0);
    await expect(page.locator("[data-seccion-temporada]")).toHaveCount(0);
    await expect(page.locator(".cinta-tematica")).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Horario y reparto" })).toBeVisible();
    expect((await page.goto(`/productos/${slug}`))?.status()).toBe(404);
  } finally {
    sqlLocal(`
      delete from public.tematica_productos
       where producto_id in (select id from public.productos where slug = '${slug}');
      delete from public.producto_variantes
       where producto_id in (select id from public.productos where slug = '${slug}');
      delete from public.productos where slug = '${slug}';
      update public.tematicas
         set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
             fecha_evento = nullif('${evento}', '')::date, estilo = '${estilo}'
       where slug = 'navidad';
    `);
    await borrarUsuario(usuario.id);
  }
});
