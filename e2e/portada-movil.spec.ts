import { expect, test } from "@playwright/test";

/**
 * La portada del celular no lleva carrusel (decision de Dan, 12/09/2026).
 *
 * En escritorio se queda como estaba: son dos presentaciones distintas de la
 * misma pagina, no una que se encoge.
 */

test("en el celular no hay carrusel, y si foto quieta, nombre y como pedir", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Es la portada del celular.");

  await page.goto("/");

  const portada = page.locator("[data-portada-movil]");
  await expect(portada).toBeVisible();

  // El carrusel sigue en el DOM para el escritorio, pero aqui no se ve: lo que
  // se comprueba es que no le llega al cliente, no que no exista.
  await expect(page.locator('[aria-roledescription="carrusel"]')).toBeHidden();

  await expect(portada.getByText("Panadería Pimpo's")).toBeVisible();
  await expect(portada.locator("[data-estado]")).toBeVisible();
  await expect(portada.getByRole("link", { name: "Pedir por WhatsApp" })).toBeVisible();
});

test("en escritorio el carrusel sigue estando", async ({ page, isMobile }) => {
  test.skip(isMobile, "Es la portada de escritorio.");

  await page.goto("/");

  await expect(page.locator('[aria-roledescription="carrusel"]')).toBeVisible();
  await expect(page.locator("[data-portada-movil]")).toBeHidden();
});

test("la portada sigue teniendo un solo h1", async ({ page }) => {
  // Dos presentaciones en la misma pagina son dos sitios donde colar un h1 de
  // mas. El de la portada va oculto a la vista y es uno solo (doc 03 §7).
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
});
