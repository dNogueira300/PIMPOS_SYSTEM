import { expect, test } from "@playwright/test";

/**
 * El momento de pedir (critica de diseno del 11/09/2026, P1).
 *
 * Antes de pulsar "Pedir por WhatsApp" el cliente tiene que saber que pasa al
 * pulsarlo, a que numero escribe y cuanto le cuesta el delivery. Los valores de
 * estas pruebas son los que carga la migracion 0017: vienen de la base, no del
 * codigo, y si desaparecen de la pagina es un fallo.
 */

function textoDelMensaje(href: string | null): string {
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  return new URL(href!).searchParams.get("text") ?? "";
}

const CONDICIONES = [
  ["Delivery", "S/ 3.00"],
  ["Pedido mínimo", "S/ 10.00"],
  ["Llega en", "30 a 45 minutos"],
  ["Pagas con", "Efectivo, Yape o Plin"],
  ["Repartimos en", "Iquitos, Belén, Punchana y San Juan Bautista"],
] as const;

test("el detalle de producto dice que pasa al pedir y cuanto cuesta", async ({ page }) => {
  await page.goto("/productos/frances-chico");
  const principal = page.getByRole("main");

  const boton = principal.getByRole("link", { name: "Pedir por WhatsApp" });
  await expect(boton).toBeVisible();

  // El mensaje llega con el producto y con el hueco para cuanto y a donde.
  const mensaje = textoDelMensaje(await boton.getAttribute("href"));
  expect(mensaje).toContain("Pan francés chico");
  expect(mensaje).toContain("\nCantidad:");
  expect(mensaje).toContain("\nDirección de entrega:");

  // Lo que pasa al pulsar, dicho antes de pulsar.
  await expect(principal.getByText(/Se abre WhatsApp con tu pedido ya escrito/)).toBeVisible();

  // El numero, como se dicta, y no como lo guarda la base.
  await expect(principal.getByText("947 874 820", { exact: true })).toBeVisible();
  await expect(principal.getByText("51947874820")).toHaveCount(0);

  // Cada condicion con su dato, en la misma linea.
  const condiciones = principal.locator("dl").filter({ hasText: "Pedido mínimo" });
  for (const [etiqueta, valor] of CONDICIONES) {
    const fila = condiciones
      .locator("div")
      .filter({ has: page.locator("dt", { hasText: etiqueta }) });
    await expect(fila.locator("dd")).toHaveText(valor);
  }
});

test("de la ficha se llega a los pasos para pedir, y ahi mismo se puede pedir", async ({
  page,
}) => {
  await page.goto("/productos/frances-chico");

  await page
    .getByRole("main")
    .getByRole("link", { name: /Cómo hacer un pedido/ })
    .click();
  await expect(page).toHaveURL(/\/preguntas-frecuentes#como-hacer-un-pedido$/);

  const guia = page.locator("#como-hacer-un-pedido");
  await expect(guia).toBeInViewport();

  // Quien acaba de leer los pasos no tiene que volver atras a buscar el boton.
  const boton = guia.getByRole("link", { name: "Pedir por WhatsApp" });
  await expect(boton).toBeVisible();
  expect(textoDelMensaje(await boton.getAttribute("href"))).toContain("\nDirección de entrega:");
});

test("cada 'escríbenos por WhatsApp' se puede pulsar", async ({ page }) => {
  // Una pagina que dice "escríbenos por WhatsApp" sin dejar pulsarlo manda al
  // cliente a buscar el boton por su cuenta.
  for (const ruta of ["/productos", "/preguntas-frecuentes"]) {
    await page.goto(ruta);

    const enlace = page.getByRole("link", { name: "escríbenos por WhatsApp" });
    await expect(enlace, `en ${ruta}`).toBeVisible();
    expect(await enlace.getAttribute("href"), `en ${ruta}`).toMatch(/^https:\/\/wa\.me\/\d+/);
    expect(await enlace.getAttribute("target"), `en ${ruta}`).toBe("_blank");
  }
});

test("contacto muestra el numero de WhatsApp escrito y las condiciones", async ({ page }) => {
  await page.goto("/contacto");
  const principal = page.getByRole("main");

  const numero = principal.getByRole("link", { name: "947 874 820" });
  await expect(numero).toBeVisible();
  expect(await numero.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/51947874820\?/);

  await expect(principal.getByRole("heading", { name: "Delivery" })).toBeVisible();
  await expect(principal.getByText("S/ 10.00")).toBeVisible();
});

test("la portada pone el precio del delivery en su propio bloque", async ({ page }) => {
  await page.goto("/");

  const bloque = page.getByRole("region", { name: "Te lo llevamos a tu casa" });
  await expect(bloque).toContainText("Iquitos, Belén, Punchana y San Juan Bautista");
  await expect(bloque).toContainText("S/ 3.00");
  await expect(bloque).toContainText("S/ 10.00");

  const boton = bloque.getByRole("link", { name: "Pedir por WhatsApp" });
  expect(textoDelMensaje(await boton.getAttribute("href"))).toContain("\nDirección de entrega:");
});

test("en un celular las condiciones caben sin desbordar", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El ancho que importa aqui es el de 375 px.");

  for (const ruta of ["/productos/frances-chico", "/contacto", "/"]) {
    await page.goto(ruta);
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde, `desborde horizontal en ${ruta}`).toBe(0);
  }
});
