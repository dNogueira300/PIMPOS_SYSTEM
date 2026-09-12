import { expect, test } from "@playwright/test";

/**
 * Los detalles menores de la critica de diseno del 11/09/2026: el nombre que no
 * se leia en el celular, el menu sin "Inicio" ni horario, la direccion escrita
 * a mano en la galeria, el rotulo cortado en el carrusel y el arranque de la
 * historia. Cada uno es pequeno; juntos son la diferencia entre un sitio que se
 * nota cuidado y uno que no.
 */

test("el nombre del negocio se lee en la cabecera, en cualquier pantalla", async ({ page }) => {
  await page.goto("/");
  const cabecera = page.getByRole("banner");

  // El enlace a la portada existe siempre, se vea lo que se vea dentro.
  await expect(
    cabecera.getByRole("link", { name: "Panadería Pimpo's, ir al inicio" }),
  ).toBeVisible();

  // El nombre va escrito, no dibujado. El logo raster a 44 px de alto dejaba
  // «PANADERÍA PASTELERÍA Y BODEGA» en letras de dos píxeles: se arregló primero
  // en el celular y el escritorio se quedó con el raster (crítica del 12/09).
  await expect(cabecera.getByText("Panadería Pimpo's", { exact: true })).toBeVisible();
  await expect(cabecera.getByAltText("Panadería Pimpo's", { exact: true })).toHaveCount(0);

  // El isotipo es vectorial: escala sin romperse en ningún tamaño.
  const marca = cabecera.locator("img").first();
  await expect(marca).toHaveAttribute("src", /\.svg($|\?)/);
});

test("el menu del celular empieza por Inicio y trae el horario", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menu desplegable es del celular.");
  await page.goto("/contacto");

  await page.getByRole("button", { name: "Abrir el menú" }).click();
  const menu = page.locator("#menu-movil");

  const inicio = menu.getByRole("link", { name: "Inicio" });
  await expect(inicio).toBeVisible();
  await expect(inicio).toHaveAttribute("href", "/");
  // Y es la primera opcion, que es donde se busca.
  await expect(menu.getByRole("link").first()).toHaveText("Inicio");

  const horario = menu.getByRole("region", { name: "Horario de atención" });
  await expect(horario).toContainText("Lunes a sábado");
  await expect(horario).toContainText("4:00 a. m. a 1:00 p. m.");
  await expect(horario).toContainText("Cerrado");
});

test("la galeria dice la direccion que tiene cargada el negocio", async ({ page }) => {
  await page.goto("/galeria");

  // Estaba escrita a mano como "Calle Elías Aguirre, en Belén", sin numero. El
  // "1321" solo esta en la configuracion: si aparece, el dato sale de la base.
  await expect(
    page.getByRole("heading", { level: 1 }).locator("xpath=following-sibling::p"),
  ).toContainText("Calle Elías Aguirre 1321, en Belén");
});

test("cada diapositiva se encuadra por la altura que tiene guardada", async ({ page }) => {
  await page.goto("/");

  // La fachada, al 30 %: centrada, en escritorio se cortaba el rotulo.
  const fachada = page
    .locator('[aria-roledescription="diapositiva"][aria-label="1 de 3"] img')
    .first();
  await expect(fachada).toHaveCSS("object-position", "50% 30%");

  const horno = page
    .locator('[aria-roledescription="diapositiva"][aria-label="3 de 3"] img')
    .first();
  await expect(horno).toHaveCSS("object-position", "50% 50%");
});

test("la historia de la portada ya no empieza por «Bienvenidos»", async ({ page }) => {
  await page.goto("/");

  const bloque = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Veintidós años en el barrio" }) });
  await expect(bloque).toContainText("emprendimiento familiar");
  await expect(bloque).not.toContainText("Bienvenidos");
});
