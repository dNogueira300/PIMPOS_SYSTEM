import { expect, test } from "@playwright/test";

// Prueba de humo: el sitio arranca, esta en espanol y muestra la portada.
// Las pruebas de los flujos criticos (doc 03 §6) llegan con cada modulo.
test("la portada carga en espanol", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
  await expect(page).toHaveTitle(/Panadería Pimpo's/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pimpo's");
});
