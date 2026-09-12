import { expect, test } from "@playwright/test";

/**
 * El mapa no puede montarse encima de la cabecera.
 *
 * Leaflet reparte `z-index` de 400 a 1000 entre sus paneles y controles, y la
 * cabecera del sitio es `z-40`: sin un contexto de apilamiento propio el mapa
 * gana siempre, y al bajar la pagina tapaba el menu entero (12/09/2026).
 *
 * Se comprueba preguntando **quien recibe el clic** en el centro de la cabecera
 * mientras el mapa esta debajo. Mirar el `z-index` calculado no serviria: el
 * numero puede ser cualquiera si cada uno vive en su propio contexto, que es
 * justo lo que se arreglo.
 */

test("al bajar, la cabecera queda por encima del mapa", async ({ page }) => {
  await page.goto("/ubicacion");

  // El mapa se carga en diferido: hasta que no existe, no hay nada que tapar.
  const mapa = page.locator('[role="application"]');
  await expect(mapa).toBeVisible();
  await page.waitForFunction(() => document.querySelector(".leaflet-container") !== null);

  // Se baja hasta que el mapa pasa por detras de la cabecera pegajosa.
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(300);

  const quienManda = await page.evaluate(() => {
    const cabecera = document.querySelector("header");
    if (!cabecera) return { hayCabecera: false, esDelMapa: false, etiqueta: "" };

    const caja = cabecera.getBoundingClientRect();
    const encima = document.elementFromPoint(
      caja.left + caja.width / 2,
      caja.top + caja.height / 2,
    );
    if (encima === null) return { hayCabecera: true, esDelMapa: false, etiqueta: "(nada)" };

    return {
      hayCabecera: true,
      // `closest` y no el elemento suelto: lo que importa es de quien es el
      // trozo de pantalla, no que etiqueta concreta toco el punto.
      esDelMapa: encima.closest(".leaflet-container") !== null,
      etiqueta: encima.className?.toString().slice(0, 60) ?? "",
    };
  });

  expect(quienManda.hayCabecera).toBe(true);
  expect(
    quienManda.esDelMapa,
    `el mapa se monto encima de la cabecera (elemento: ${quienManda.etiqueta})`,
  ).toBe(false);
});

test("el menu del celular se abre por encima del mapa", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menu desplegable solo existe por debajo de lg.");

  await page.goto("/ubicacion");
  await page.waitForFunction(() => document.querySelector(".leaflet-container") !== null);
  await page.evaluate(() => window.scrollBy(0, 300));

  // Con el mapa a la vista, el menu tiene que poder usarse: era el caso que
  // dejaba al cliente sin navegacion en la pagina de la ubicacion.
  await page.getByRole("button", { name: "Abrir el menú" }).click();
  const menu = page.locator("#menu-movil");
  await expect(menu.getByRole("link", { name: "Galería", exact: true })).toBeVisible();
  await menu.getByRole("link", { name: "Galería", exact: true }).click();
  await expect(page).toHaveURL(/\/galeria$/);
});
