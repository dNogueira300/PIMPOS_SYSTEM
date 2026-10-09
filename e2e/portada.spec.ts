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

  // El logo aprobado y el nombre escrito conservan el enlace a inicio.
  // La imagen cargada en ambos tamaños se comprueba en `cabecera.spec.ts`.
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Panadería Pimpo's, ir al inicio" }),
  ).toBeVisible();
});

test("la portada muestra los tres datos verificables", async ({ page }) => {
  await page.goto("/");

  // Son datos de la ficha (2.5, 1.8, 1.11), no promesas de marketing. Si
  // alguno desaparece de la portada, es una decision, no un descuido.
  //
  // El tercero se titulaba «Desde 2004» hasta la fase 3.1: el año pasó al sello
  // flotante del bloque de nosotros, como en el prototipo, para no decir lo
  // mismo dos veces en la misma página (plan 03.1, tarea 5).
  const franja = page.getByRole("region", { name: "Por qué comprar aquí" });
  for (const dato of ["Del día", "A toda Iquitos", "En el barrio"]) {
    await expect(franja.getByText(dato, { exact: true })).toBeVisible();
  }
});

test("el hero de escritorio conserva contraste sobre el panel terracota de la dirección A", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "El hero con carrusel es de escritorio.");
  await page.goto("/");

  const titular = page.locator('[aria-roledescription="diapositiva"][aria-label="1 de 3"] h2');
  await expect(titular).toBeVisible();
  // La composición aprobada en T5 coloca el titular blanco sobre terracota sólido.
  // La relación de contraste AA la prueba paleta.test.ts.
  await expect(titular).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(
    titular.locator("xpath=ancestor::*[contains(@class, 'hero-disposicion')]"),
  ).toHaveCSS("background-color", "rgb(149, 62, 44)");
});

test("el bloque de nosotros dice el año de apertura, no una cuenta de años inventada", async ({
  page,
}) => {
  await page.goto("/");

  // El sello flotante del prototipo decía «24+ Años horneando en la Amazonía».
  // Aquí dice el año, que sale de la base y no caduca.
  const sello = page.locator("[data-sello-apertura]");
  await expect(sello).toBeVisible();
  await expect(sello).toContainText(/^Desde \d{4}/);
  await expect(page.getByText(/\d+\+\s*años/i)).toHaveCount(0);
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

  // Plus Jakarta Sans en titulares y texto (dirección A, plan 03.2).
  // next/font nombra la familia con la variable
  // exportada en src/estilos/fuentes.ts (`jakarta`), asi que se
  // comprueba ese nombre. Que la clase este puesta en el <html> no basta: esto
  // verifica que la cadena token -> variable -> familia llega entera.
  const familiaTitulo = await page
    .getByRole("heading", { level: 2 })
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(familiaTitulo).toMatch(/jakarta/i);

  const familiaTexto = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
  expect(familiaTexto).toMatch(/jakarta/i);

  // Y que el archivo se haya cargado de verdad, no solo declarado.
  const cargadas = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
  );
  expect(cargadas.join(" ")).toMatch(/jakarta/i);
});

test("el hero separa texto y foto sin velo ni controles sobre el texto", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "El carrusel es de escritorio.");
  for (const ancho of [768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto("/");
    const slide = page.locator('[aria-roledescription="diapositiva"][aria-hidden="false"]');
    await expect(slide.locator("[data-texto-hero]")).toBeVisible();
    await expect(page.locator(".velo-hero")).toHaveCount(0);
    const medida = await slide.evaluate((el) => {
      const panel = el.querySelector("[data-panel-hero]")!.getBoundingClientRect();
      const textos = [...el.querySelector("[data-texto-hero]")!.children].map((h) =>
        h.getBoundingClientRect(),
      );
      const imagen = el.querySelector("img")?.getBoundingClientRect();
      const controles = [...document.querySelectorAll('[aria-roledescription="carrusel"] button')]
        .map((b) => b.getBoundingClientRect())
        .filter((b) => b.width > 0);
      const solapan = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return {
        contenido: textos.every(
          (t) =>
            t.left >= panel.left &&
            t.right <= panel.right &&
            t.top >= panel.top &&
            t.bottom <= panel.bottom,
        ),
        foto: !imagen || textos.every((t) => !solapan(t, imagen)),
        tapado: textos.some((t) => controles.some((c) => solapan(t, c))),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(medida, String(ancho)).toEqual({
      contenido: true,
      foto: true,
      tapado: false,
      overflow: false,
    });
  }
});
