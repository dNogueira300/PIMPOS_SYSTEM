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
    // Por la forma y no por el numero: «Veintidós» cambia solo el 1 de enero, y
    // escrito aqui la prueba habria fallado sin que nada estuviera roto.
    .filter({ has: page.getByRole("heading", { name: /años en el barrio/ }) });
  await expect(bloque).toContainText("emprendimiento familiar");
  await expect(bloque).not.toContainText("Bienvenidos");
});

test("la barra de aviso dice la hora y las zonas que hay en la base", async ({ page }) => {
  await page.goto("/");
  const aviso = page.locator("[data-aviso]");
  await expect(aviso).toBeVisible();

  // La apertura del horario cargado y una de las cuatro zonas confirmadas el
  // 11/09: sale de la base, no escrito a mano.
  await expect(aviso).toContainText("Abrimos a las 4:00 a. m.");
  await expect(aviso).toContainText("Belén");

  // Lo que decía el prototipo de Stitch es inventado y no puede aparecer.
  await expect(page.getByText(/Putumayo/)).toHaveCount(0);
  await expect(page.getByText(/Lunes a Domingo/i)).toHaveCount(0);
});

test("la cabecera es clara y la sección activa va en píldora azul", async ({ page, isMobile }) => {
  test.skip(isMobile, "La navegación en línea es de escritorio.");
  await page.goto("/productos");

  const cabecera = page.getByRole("banner");
  // Crema, no el azul de antes (plan 03.1, tarea 4).
  await expect(cabecera).toHaveCSS("background-color", "rgb(255, 249, 238)");

  const activa = cabecera.getByRole("link", { name: "Productos" });
  await expect(activa).toHaveAttribute("aria-current", "page");
  await expect(activa).toHaveCSS("background-color", "rgb(18, 48, 110)");
});

test("la cabecera cabe sin desbordar en los anchos intermedios", async ({ page, isMobile }) => {
  test.skip(isMobile, "Los anchos se fijan dentro de la prueba.");

  // En la tarea 4 del plan 03.1 la cabecera pasó a 1197 px de contenido: a 1024
  // y 1100 px la página entera se desplazaba en horizontal. Ninguna otra prueba
  // lo veía, porque el proyecto de escritorio mide solo a 1280 y el de celular
  // a 375. Se miden aquí los anchos de tableta y portátil pequeño, donde es más
  // fácil que la navegación en línea no quepa.
  const fallos: string[] = [];
  for (const ancho of [768, 1024, 1100, 1280, 1366]) {
    await page.setViewportSize({ width: ancho, height: 800 });
    for (const ruta of ["/", "/productos"]) {
      await page.goto(ruta);
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (desborde > 0) fallos.push(`${ruta} a ${ancho} px: ${desborde} px de más`);
    }
  }
  expect(fallos, `Desborde horizontal:\n${fallos.join("\n")}`).toEqual([]);
});
