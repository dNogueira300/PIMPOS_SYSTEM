import { expect, test } from "@playwright/test";

// Prueba de humo: el sitio arranca, esta en espanol y muestra la portada.
// Las pruebas de los flujos criticos (doc 03 §6) llegan con cada modulo.

test("la portada carga en espanol", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
  await expect(page).toHaveTitle(/Panadería Pimpo's/);

  // El h1 es el eslogan, no el nombre del negocio: el nombre ya lo dice el
  // logo, y repetirlo desperdiciaria el titular. La marca sigue siendo
  // accesible para un lector de pantalla por el `alt` de la imagen.
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pan fresco, tradición de siempre",
  );
  await expect(page.getByAltText("Panadería Pimpo's")).toBeVisible();
});

test("la portada muestra los tres datos verificables", async ({ page }) => {
  await page.goto("/");

  // Son datos de la ficha (2.5, 1.8, 1.11), no promesas de marketing. Si
  // alguno desaparece de la portada, es una decision, no un descuido.
  for (const dato of ["Del día", "A toda Iquitos", "Desde 2004"]) {
    await expect(page.getByText(dato, { exact: true })).toBeVisible();
  }
});

test("el sistema de diseno esta aplicado", async ({ page }) => {
  await page.goto("/");

  // El fondo nunca es blanco puro: es una regla de marca (docs/marca.md §8),
  // y lo unico que la sostiene son los tokens. Si alguien rompiera la cadena
  // de variables CSS, el navegador caeria a blanco y esto lo detecta.
  const fondo = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);

  expect(fondo).not.toBe("rgb(255, 255, 255)");
  expect(fondo).not.toBe("rgba(0, 0, 0, 0)");
});

test("la tipografia elegida llega al navegador", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  // next/font genera nombres de familia con hash (`__Fraunces_a1b2c3`), asi que
  // se comprueba el prefijo. Que la clase este puesta en el <html> no basta:
  // esto verifica que la cadena token -> variable -> familia llega entera.
  const familiaTitulo = await page
    .getByRole("heading", { level: 1 })
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(familiaTitulo).toMatch(/Fraunces/i);

  const familiaTexto = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
  expect(familiaTexto).toMatch(/Inter/i);

  // Y que el archivo se haya cargado de verdad, no solo declarado.
  const cargadas = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
  );
  expect(cargadas.join(" ")).toMatch(/Fraunces/i);
});
