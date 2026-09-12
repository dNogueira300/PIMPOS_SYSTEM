import { expect, test } from "@playwright/test";

// La portada es la pagina que mas se abre y la unica que casi todos veran.
// Estas pruebas cubren lo que tiene que seguir siendo cierto aunque el diseno
// cambie: que el contenido venga de la base, que el precio se vea, que el
// delivery este a mano y que se pueda navegar con teclado.

test("la portada carga en espanol y con su encabezado", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
  await expect(page).toHaveTitle(/Panadería Pimpo's/);

  // El h1 no se ve: el hero es una foto con el titular del slide, que cambia
  // solo. Tiene que existir igualmente para quien navega con lector de
  // pantalla, y decir de que negocio es esta pagina.
  const titulo = page.getByRole("heading", { level: 1 });
  await expect(titulo).toHaveCount(1);
  await expect(titulo).toContainText("Panadería Pimpo's");

  // La marca en la cabecera, sea el logo (escritorio) o el isotipo con el
  // nombre escrito (celular, donde el logo completo no se lee). El enlace es lo
  // que hay en los dos casos; que cada uno enseñe lo suyo lo cubre
  // `cabecera.spec.ts`.
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Panadería Pimpo's, ir al inicio" }),
  ).toBeVisible();
});

test("la portada muestra los tres datos verificables", async ({ page }) => {
  await page.goto("/");

  // Son datos de la ficha (2.5, 1.8, 1.11), no promesas de marketing. Si
  // alguno desaparece de la portada, es una decision, no un descuido.
  for (const dato of ["Del día", "A toda Iquitos", "Desde 2004"]) {
    await expect(page.getByText(dato, { exact: true })).toBeVisible();
  }
});

test("el catalogo llega desde la base con su precio a la vista", async ({ page }) => {
  await page.goto("/");

  // Los productos NO estan escritos en el codigo: salen de `productos_publicos`
  // por PostgREST. Si esta prueba falla, o se rompio la vista o se rompio la
  // capa de datos, y en los dos casos hay que enterarse.
  const filas = page.getByRole("main").locator('a[href^="/productos/"]');
  await expect(filas.first()).toBeVisible();
  expect(await filas.count()).toBeGreaterThan(3);

  // El precio se muestra con orgullo (ficha 5.2). Hay pan a S/ 0.10 y esconderlo
  // seria contradecir la decision de diseno.
  //
  // `visible: true`: en el celular el carrusel sigue en el DOM pero oculto, y el
  // subtitulo de una diapositiva menciona un precio. Sin esto, `.first()` se
  // quedaba con un texto que nadie ve y la prueba fallaba sin que faltara ningun
  // precio en pantalla.
  await expect(
    page
      .getByText(/S\/\s?\d/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test("un borrador nunca llega a la portada", async ({ page }) => {
  await page.goto("/");

  // La semilla no carga borradores, asi que esto vigila lo contrario: que la
  // pagina no imprima nada con marca de estado interno. Si algun dia una vista
  // perdiera su `where`, aqui se veria.
  await expect(page.getByText(/borrador/i)).toHaveCount(0);
});

test("el pedido por WhatsApp esta siempre a mano", async ({ page, isMobile }) => {
  await page.goto("/");

  const enlaces = page.locator('a[href^="https://wa.me/"]');
  expect(await enlaces.count()).toBeGreaterThan(0);

  // El mensaje va escrito de antemano (R4): el cliente compra desde el celular
  // y escribir es justo la friccion que hace que no pregunte.
  const destino = await enlaces.first().getAttribute("href");
  expect(destino).toContain("text=");

  // En movil ademas hay boton flotante, porque el de la cabecera no cabe.
  if (isMobile) {
    await expect(page.getByRole("link", { name: /pedir/i }).first()).toBeVisible();
  }
});

test("los horarios dicen que el domingo esta cerrado", async ({ page }) => {
  await page.goto("/");

  // Los dos turnos y el cierre dominical salen de `configuracion_sitio`
  // (ficha 1.9). Es un dato que el cliente comprueba antes de salir de casa.
  //
  // Dentro del contenido, no en cualquier sitio: el menu del celular tambien
  // trae el horario y existe en el DOM aunque este cerrado, asi que el primer
  // "Cerrado" de la pagina es uno que no se ve.
  //
  // Y `exact`, ademas: el horario dice tambien si esta abierto ahora, asi que a
  // ciertas horas el primer "Cerrado" del contenido es el "Cerrado ahora" del
  // estado. Sin `exact` esta prueba seguiria en verde sin mirar nunca la fila
  // del domingo, que es lo que dice comprobar.
  //
  // Y `visible: true`, desde que la portada tiene dos versiones: la del celular
  // vive en el DOM tambien en escritorio (oculta por CSS), asi que su "Abre hoy
  // a las 4:00 a. m." era el primero que encontraba `.first()` — un elemento
  // que nadie ve. Lo que esta prueba mira es lo que el cliente lee.
  const principal = page.getByRole("main");
  await expect(
    principal.getByText("Cerrado", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(
    principal
      .getByText(/4:00 a\. m\./)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test("se puede llegar al catalogo solo con el teclado", async ({ page, isMobile }) => {
  test.skip(isMobile, "La navegacion por teclado se comprueba en escritorio.");

  await page.goto("/");

  // El primer tabulador tiene que dar el salto al contenido. Sin el, quien usa
  // teclado recorre las siete secciones en cada pagina.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();

  // Se busca dentro de la cabecera: el pie repite las mismas siete secciones,
  // y un `.first()` a ciegas puede caer en el enlace que no se ve.
  const cabecera = page.getByRole("banner");
  await cabecera.getByRole("link", { name: "Productos", exact: true }).click();
  await expect(page).toHaveURL(/\/productos$/);
});

test("el menu de movil se abre y se cierra", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menu desplegable solo existe por debajo de lg.");

  await page.goto("/");

  const boton = page.getByRole("button", { name: /abrir el menú/i });
  await expect(boton).toHaveAttribute("aria-expanded", "false");

  await boton.click();
  await expect(page.getByRole("button", { name: /cerrar el menú/i })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  // Dentro del menu, no en cualquier sitio: el pie tiene los mismos enlaces.
  const menu = page.locator("#menu-movil");
  await expect(menu.getByRole("link", { name: "Galería", exact: true })).toBeVisible();

  // Y al elegir una seccion el menu se cierra solo, sin quedarse encima de la
  // pagina nueva.
  await menu.getByRole("link", { name: "Galería", exact: true }).click();
  await expect(page).toHaveURL(/\/galeria$/);
  await expect(page.getByRole("button", { name: /abrir el menú/i })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
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
    .getByRole("heading", { level: 2 })
    .first()
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
