import { expect, test } from "@playwright/test";

/**
 * Los productos con mas de una presentacion (P2 de la critica del 12/09).
 *
 * Dos de los treinta y cuatro: la hamburguesa grande y la de ajonjoli, a
 * S/ 0.30 y S/ 0.40. Antes la ficha decia "2 presentaciones" y "Desde S/ 0.30",
 * y el mensaje de WhatsApp salia sin decir cual: el pedido se hacia a ciegas.
 */

test("la ficha enseña las dos presentaciones con su precio", async ({ page }) => {
  await page.goto("/productos/hamburguesa-grande");

  const bloque = page.locator("[data-presentaciones]");
  await expect(bloque).toBeVisible();

  const filas = bloque.locator("li");
  await expect(filas).toHaveCount(2);

  // Los dos precios, no solo el de la predeterminada: es lo unico que hoy
  // distingue una presentacion de la otra.
  await expect(filas.nth(0)).toHaveAttribute("data-precio", "0.3");
  await expect(filas.nth(1)).toHaveAttribute("data-precio", "0.4");
  await expect(bloque).toContainText("S/ 0.30");
  await expect(bloque).toContainText("S/ 0.40");
});

test("el mensaje de WhatsApp lleva la linea para elegir presentacion", async ({ page }) => {
  await page.goto("/productos/hamburguesa-grande");

  // El cliente no tiene que escribirla de memoria: el mensaje va con las
  // opciones dentro y un hueco donde marcar la suya.
  const pedir = page.getByRole("main").getByRole("link", { name: "Pedir por WhatsApp" });
  const enlace = await pedir.getAttribute("href");

  expect(enlace).toContain("Presentaci%C3%B3n");
  expect(decodeURIComponent(enlace ?? "")).toContain("Presentación (De S/ 0.30 o De S/ 0.40): ");
});

test("un producto de una sola presentacion no gana una lista de una fila", async ({ page }) => {
  // 32 de los 34 se venden de una sola forma. Un encabezado "Presentaciones"
  // con una linea debajo es ruido que no responde ninguna pregunta.
  await page.goto("/productos/frances-chico");

  await expect(page.locator("[data-presentaciones]")).toHaveCount(0);
});
