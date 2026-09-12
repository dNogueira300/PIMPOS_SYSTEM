import { expect, test } from "@playwright/test";

/**
 * Los testimonios de ejemplo no se publican (critica del 12/09/2026, P0).
 *
 * La portada mostraba «Texto de ejemplo para maquetar el bloque de testimonios»
 * firmado «Cliente de ejemplo 1, Iquitos». El unico bloque cuya funcion es dar
 * confianza decia que la pagina estaba sin terminar, y con ella caia la
 * credibilidad de los precios y del delivery.
 *
 * El entorno local carga esos tres testimonios de ejemplo a proposito (semilla
 * 02_demo), asi que esta prueba se corre justo donde el fallo ocurria: si el
 * filtro desaparece, aqui se ve.
 */

test("ningun testimonio de ejemplo llega a la portada", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/Cliente de ejemplo/)).toHaveCount(0);
  await expect(page.getByText(/Texto de ejemplo/)).toHaveCount(0);
  await expect(page.getByText(/para maquetar/)).toHaveCount(0);
});

test("sin testimonios reales, el bloque no deja un hueco a medias", async ({ page }) => {
  await page.goto("/");

  // Un titulo sin nada debajo se lee como algo que se rompio. O hay
  // testimonios de verdad, o no hay bloque.
  const titulo = page.getByRole("heading", { name: "Lo que dicen los vecinos" });
  const cuantos = await titulo.count();

  if (cuantos === 0) {
    // Es lo que toca hoy: los tres de la base son de ejemplo.
    expect(cuantos).toBe(0);
    return;
  }

  const bloque = page.locator("section").filter({ has: titulo }).first();
  expect(await bloque.locator("blockquote").count()).toBeGreaterThan(0);
});
