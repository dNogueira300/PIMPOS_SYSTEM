import { expect, test, type Page } from "@playwright/test";

import { sqlLocal } from "./ayudas/base";
import { conCerrojo } from "./ayudas/cerrojo";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * El panel de temáticas de temporada (plan 08, T2).
 *
 * Escribe en la fila de Navidad, que es una sola para toda la suite, y encender
 * una temática viste el sitio entero: corre en el proyecto `tematicas`, solo y
 * después del resto (playwright.config.ts). Las fechas se escriben relativas a
 * hoy para que la prueba no caduque.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
/** «2026-11-25»: hoy en Iquitos más `dias`. */
function dia(dias: number): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000 + dias * DIA_MS).toISOString().slice(0, 10);
}
/** Las tarjetas de la lista (a 375 px la tabla está oculta, pero sigue en el DOM). */
const lista = (page: Page) => page.getByRole("list", { name: "Temáticas de temporada" });
const diaYMes = (fecha: string) => fecha.split("-").reverse().slice(0, 2).join("/");

/** Devuelve Navidad a como la deja la migración, y borra el producto de prueba. */
function limpiar(slug: string) {
  sqlLocal(`
    delete from public.tematica_productos
     where producto_id in (select id from public.productos where slug = '${slug}');
    delete from public.producto_variantes
     where producto_id in (select id from public.productos where slug = '${slug}');
    delete from public.productos where slug = '${slug}';
    update public.tematicas
       set encendido = 'fechas', inicio = '2026-12-01', fin = '2026-12-26', fecha_evento = '2026-12-25'
     where slug = 'navidad';
  `);
}

test("encender Navidad a mano publica lo de temporada y apagarla lo esconde", async ({ page }) => {
  // Puede esperar a que termine la del sitio (`tematica-navidad.spec.ts`).
  test.setTimeout(240_000);
  // Las dos pruebas que encienden Navidad escriben la misma fila: una a la vez.
  await conCerrojo("tematica-navidad", async () => {
    const slug = `torta-e2e-${Date.now()}`;
    const nombre = `Torta E2E ${slug.slice(-6)}`;
    sqlLocal(`
      insert into public.productos (categoria_id, nombre, slug, estado)
      select id, '${nombre}', '${slug}', 'publicado' from public.categorias_producto
       where deleted_at is null order by orden limit 1;
      insert into public.producto_variantes (producto_id, nombre, precio, unidad_venta, es_predeterminada)
      select id, 'Unidad', 25, 'unidad', true from public.productos where slug = '${slug}';
    `);
    const usuario = await entrarComo(page, "administrador");
    try {
      await page.goto("/admin/contenido");
      await page.getByRole("link", { name: "Temáticas de temporada" }).click();
      await page.waitForURL("/admin/contenido/tematicas");
      await page.getByRole("link", { name: "Navidad" }).first().click();
      await page.waitForURL("/admin/contenido/tematicas/navidad");

      // Productos: el de prueba, solo de temporada.
      await page.getByRole("tab", { name: "Productos" }).click();
      const productos = page.getByRole("tabpanel", { name: "Productos" });
      await productos.getByLabel("Añadir un producto").selectOption({ label: nombre });
      await productos.getByRole("button", { name: "Añadir" }).click();
      await productos.getByLabel("Solo se vende en esta temporada").check();

      // Cuándo: fechas por llegar y «Encendida ya».
      await page.getByRole("tab", { name: "Cuándo" }).click();
      const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
      await cuando.getByLabel("Empieza el").fill(dia(5));
      await cuando.getByLabel("Termina el").fill(dia(30));
      await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
      await page.getByRole("button", { name: "Guardar" }).click();
      await page.waitForURL("/admin/contenido/tematicas");
      await expect(
        lista(page).getByText(`Encendida a mano hasta el ${diaYMes(dia(30))}`),
      ).toBeVisible();

      // El sitio ya lo muestra.
      const visible = await page.goto(`/productos/${slug}`);
      expect(visible?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();

      // Apagada: el producto desaparece del sitio, sin borrarse.
      await page.goto("/admin/contenido/tematicas/navidad");
      await page
        .getByRole("tabpanel", { name: "Cuándo" })
        .getByRole("radio", { name: /^Apagada/ })
        .check();
      await page.getByRole("button", { name: "Guardar" }).click();
      await page.waitForURL("/admin/contenido/tematicas");
      await expect(
        lista(page).getByText(`Apagada a mano hasta el ${diaYMes(dia(30))}`),
      ).toBeVisible();
      const oculto = await page.goto(`/productos/${slug}`);
      expect(oculto?.status()).toBe(404);
      expect(sqlLocal(`select estado from public.productos where slug = '${slug}'`).trim()).toBe(
        "publicado",
      );
    } finally {
      limpiar(slug);
      await borrarUsuario(usuario.id);
    }
  });
});

test("el ingeniero no ve ni entra a las temáticas", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/contenido");
    await expect(page.getByRole("link", { name: "Productos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Temáticas de temporada" })).toHaveCount(0);
    await page.goto("/admin/contenido/tematicas");
    await expect(page).toHaveURL(/\/admin\?motivo=sin-acceso/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("la lista de temáticas vuelve a Contenido, como las demás listas", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/tematicas");
    // En <main>: la barra lateral también tiene un enlace «Contenido».
    const volver = page.getByRole("main").getByRole("link", { name: "Contenido", exact: true });
    await expect(volver).toHaveAttribute("href", "/admin/contenido");
    await volver.click();
    await page.waitForURL("/admin/contenido");
    await expect(page.getByRole("link", { name: "Temáticas de temporada" })).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("cada temática enseña solo sus estilos, y el Día de la Madre guarda el suyo", async ({
  page,
}) => {
  // Escribe en la fila del Día de la Madre: con el cerrojo de las temáticas.
  test.setTimeout(120_000);
  await conCerrojo("tematica-navidad", async () => {
    const usuario = await entrarComo(page, "administrador");
    const estilos = (p: Page) => p.getByRole("tabpanel", { name: "Estilo" }).getByRole("radio");
    try {
      await page.goto("/admin/contenido/tematicas");
      await expect(lista(page).getByRole("link", { name: "Navidad" }).first()).toBeVisible();
      await expect(
        lista(page).getByRole("link", { name: "Día de la Madre" }).first(),
      ).toBeVisible();

      await page.goto("/admin/contenido/tematicas/navidad");
      await page.getByRole("tab", { name: "Estilo" }).click();
      await expect(estilos(page)).toHaveCount(2);
      await expect(estilos(page).nth(0)).toHaveAccessibleName(/Noche de Navidad/);
      await expect(estilos(page).nth(1)).toHaveAccessibleName(/Crema navideña/);

      await page.goto("/admin/contenido/tematicas/dia-de-la-madre");
      await page.getByRole("tab", { name: "Estilo" }).click();
      await expect(estilos(page)).toHaveCount(2);
      await expect(estilos(page).nth(0)).toHaveAccessibleName(/Rosa sobre crema/);
      await expect(estilos(page).nth(1)).toHaveAccessibleName(/Todo en rosa/);
      await expect(estilos(page).nth(0)).toBeChecked();

      await estilos(page).nth(1).check();
      await page.getByRole("button", { name: "Guardar" }).click();
      await page.waitForURL("/admin/contenido/tematicas");
      expect(
        sqlLocal(`select estilo from public.tematicas where slug = 'dia-de-la-madre'`).trim(),
      ).toBe("rosa");
    } finally {
      sqlLocal(`update public.tematicas set estilo = 'rosa-crema' where slug = 'dia-de-la-madre'`);
      await borrarUsuario(usuario.id);
    }
  });
});
