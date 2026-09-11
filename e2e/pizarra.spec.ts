import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * La pizarra de precios (critica de diseno del 11/09/2026, P1).
 *
 * 32 de los 34 productos no tienen foto, y la rejilla de tarjetas los mostraba
 * como 32 croissants de relleno identicos, con "Unidad" debajo de casi todos.
 * Ahora el catalogo es una lista como la de un mostrador: nombre, puntos y
 * precio. Lo que se vigila es que no vuelva el relleno, que el precio siga en
 * la misma linea que su producto y que los productos con foto no la pierdan.
 */

function filasDelCatalogo(page: Page): Locator {
  // `/productos/` con barra: los filtros de categoria son `/productos?categoria=`.
  return page.getByRole("main").locator('a[href^="/productos/"]');
}

test("el catalogo es una pizarra: sin fotos de relleno y sin «Unidad»", async ({ page }) => {
  await page.goto("/productos");
  const principal = page.getByRole("main");
  const filas = filasDelCatalogo(page);
  await expect(filas.first()).toBeVisible();

  // Una linea por producto, ni una de mas ni una de menos: el total lo dice la
  // propia pagina, y asi la prueba no depende de cuantos haya en la semilla.
  const estado = (await page.getByRole("status").textContent()) ?? "";
  expect(await filas.count()).toBe(Number.parseInt(estado, 10));

  await expect(principal.locator("svg.lucide-croissant")).toHaveCount(0);
  await expect(principal.getByText("Unidad", { exact: true })).toHaveCount(0);

  // Agrupada por categoria, con encabezados que siguen al h1 sin saltarse
  // niveles: antes los nombres eran h3 directamente bajo el h1.
  await expect(principal.getByRole("heading", { level: 2, name: "Panes clásicos" })).toBeVisible();
  const niveles = await principal
    .locator("h1, h2, h3, h4")
    .evaluateAll((titulos) => titulos.map((t) => Number(t.tagName[1])));
  for (let i = 1; i < niveles.length; i++) {
    expect(
      niveles[i] - niveles[i - 1],
      `salto de h${niveles[i - 1]} a h${niveles[i]}`,
    ).toBeLessThanOrEqual(1);
  }
});

test("cada precio queda en la linea de su producto y cada fila se puede pulsar", async ({
  page,
}) => {
  await page.goto("/productos");
  const filas = filasDelCatalogo(page);
  await expect(filas.first()).toBeVisible();

  for (const fila of await filas.all()) {
    await fila.scrollIntoViewIfNeeded();
    const caja = await fila.boundingBox();
    // El area tactil minima (R15): la fila entera es el enlace.
    expect(caja!.height, await fila.innerText()).toBeGreaterThanOrEqual(44);

    // Nombre y precio comparten linea: el precio no cae debajo, huerfano.
    const nombre = await fila.locator("[data-nombre]").boundingBox();
    const precio = await fila.locator("[data-precio]").boundingBox();
    expect(precio!.y, await fila.innerText()).toBeLessThan(nombre!.y + nombre!.height);
  }
});

test("un producto con foto la conserva en la pizarra", async ({ page }) => {
  await page.goto("/productos");
  const principal = page.getByRole("main");

  // Por el nombre que se ve, no por una ruta supuesta. La primera version
  // escribia `/productos/pan-de-leche`, que no existe (es `/productos/leche`),
  // y el "no tiene imagen" pasaba sin mirar nada: cero imagenes en un enlace
  // que no esta. Por eso se exige antes que cada fila exista.
  const conFoto = principal.getByRole("link", { name: /^Pan francés chico/ });
  const sinFoto = principal.getByRole("link", { name: /^Pan de leche/ });
  await expect(conFoto).toHaveCount(1);
  await expect(sinFoto).toHaveCount(1);

  // Cuando el negocio suba mas fotos, cada producto la gana solo; lo que no
  // puede pasar es que la pizarra se la quite al que ya la tiene.
  await expect(conFoto.locator("img")).toHaveCount(1);
  await expect(sinFoto.locator("img")).toHaveCount(0);
});

test("la ficha sin foto no deja una caja vacia y pone el precio de titular", async ({ page }) => {
  // Se llega desde su fila, como llega un cliente, y no por una ruta escrita a
  // mano: la ruta real no siempre es el nombre (`/productos/leche`).
  await page.goto("/productos");
  await page
    .getByRole("main")
    .getByRole("link", { name: /^Pan de leche/ })
    .click();
  const principal = page.getByRole("main");

  await expect(principal.getByRole("heading", { level: 1 })).toHaveText("Pan de leche");
  await expect(principal.getByText(/Todavía no tenemos foto/)).toHaveCount(0);
  await expect(principal.locator("svg.lucide-croissant")).toHaveCount(0);
  await expect(principal.getByText(/Presentación/)).toHaveCount(0);

  // El primero del documento es el de la ficha; los de "También en" van
  // despues. Sin foto, el precio pasa a ser lo que mas se ve.
  const precio = principal.getByText("S/ 0.10", { exact: true }).first();
  await expect(precio).toBeVisible();
  const tamano = await precio.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  expect(tamano).toBeGreaterThanOrEqual(44);

  // Y se sigue pudiendo pedir.
  await expect(principal.getByRole("link", { name: "Pedir por WhatsApp" })).toBeVisible();
});

test("el mensaje de WhatsApp dice la presentacion solo cuando aporta", async ({ page }) => {
  const mensaje = async (ruta: string) => {
    await page.goto(ruta);
    const href = await page
      .getByRole("main")
      .getByRole("link", { name: "Pedir por WhatsApp" })
      .getAttribute("href");
    return new URL(href!).searchParams.get("text") ?? "";
  };

  expect(await mensaje("/productos/arvejas")).toMatch(/^Hola, quisiera pedir Arvejas\.\n/);
  expect(await mensaje("/productos/arroz-1kg")).toMatch(
    /^Hola, quisiera pedir Arroz \(por kilo\)\.\n/,
  );
});

test("la portada enseña lo que se hornea como pizarra, sin relleno", async ({ page }) => {
  await page.goto("/");

  const bloque = page.getByRole("region", { name: "Lo que horneamos hoy" });
  await expect(bloque.locator('a[href^="/productos/"]').first()).toBeVisible();
  expect(await bloque.locator('a[href^="/productos/"]').count()).toBeGreaterThan(3);
  await expect(bloque.locator("svg.lucide-croissant")).toHaveCount(0);
  await expect(bloque.getByText("Unidad", { exact: true })).toHaveCount(0);
});
