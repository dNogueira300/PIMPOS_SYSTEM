import { expect, test } from "@playwright/test";

/**
 * El movimiento del sitio y el horario.
 *
 * Lo que se vigila aqui no es que "se vea bonito" sino lo unico que puede
 * romperse de verdad: que una animacion deje un texto invisible, y que el
 * horario se lea de un vistazo en un telefono.
 */

test("el horario pone cada turno en su propia linea", async ({ page }) => {
  await page.goto("/contacto");

  // La primera version unia los dos turnos con un "y" en medio. En un telefono
  // la linea se partia justo por la hora de cierre y quedaba "4:00 p. m. a"
  // arriba y "9:00 p. m." abajo, que se lee como un error.
  const lunes = page.getByRole("main").locator("dl div").filter({ hasText: "Lunes" }).first();

  const lineas = lunes.locator("dd span span");
  await expect(lineas).toHaveCount(2);
  await expect(lineas.nth(0)).toContainText("4:00 a. m. a 1:00 p. m.");
  await expect(lineas.nth(1)).toContainText("4:00 p. m. a 9:00 p. m.");

  // Y estan una debajo de la otra de verdad, no una al lado de la otra.
  const arriba = await lineas.nth(0).boundingBox();
  const abajo = await lineas.nth(1).boundingBox();
  expect(arriba && abajo && abajo.y > arriba.y).toBe(true);

  // Ninguna de las dos se parte por dentro: cada turno cabe en su linea.
  for (const linea of [lineas.nth(0), lineas.nth(1)]) {
    const caja = await linea.boundingBox();
    const alturaDeLinea = await linea.evaluate(
      (el) => Number.parseFloat(getComputedStyle(el).fontSize) * 2,
    );
    expect(caja!.height).toBeLessThan(alturaDeLinea);
  }
});

test("el domingo sigue diciendo Cerrado", async ({ page }) => {
  await page.goto("/contacto");

  const domingo = page.getByRole("main").locator("dl div").filter({ hasText: "Domingo" }).first();
  await expect(domingo).toContainText("Cerrado");
});

test("todo lo animado acaba visible al llegar a el", async ({ page }) => {
  await page.goto("/");

  // El riesgo real de animar la aparicion de bloques es que uno se quede a
  // medias y su contenido no llegue a verse nunca. Un bloque que todavia no ha
  // entrado en pantalla SI empieza en opacidad cero: eso es la animacion, no un
  // fallo. Lo que hay que comprobar es que al llegar a el, se ve.
  const animados = page.locator(".aparece, .aparece-lateral, .acercarse, .aparece-grupo > *");
  const cuantos = await animados.count();
  expect(cuantos).toBeGreaterThan(5);

  const flojos: string[] = [];

  for (const elemento of await animados.all()) {
    // Se centra en la pantalla, no solo "hasta que se vea": un bloque alto
    // alineado por arriba puede quedarse a mitad de su recorrido.
    await elemento.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.evaluate(() => new Promise((listo) => requestAnimationFrame(() => listo(null))));

    const { opacidad, texto } = await elemento.evaluate((el) => ({
      opacidad: Number(getComputedStyle(el).opacity),
      texto: (el.textContent ?? "").trim().slice(0, 50),
    }));

    if (opacidad < 0.9) flojos.push(`${opacidad.toFixed(2)} — "${texto}"`);
  }

  // Si falla, la lista dice cual y con cuanta opacidad se quedo. Un "esperaba 1,
  // recibi 0.25" a secas obliga a repetir el trabajo a mano.
  expect(flojos, "Bloques que no llegan a verse: " + flojos.join(" · ")).toEqual([]);
});

test("al imprimir no queda ningun bloque en blanco", async ({ page }) => {
  await page.goto("/");
  // Sin scroll no hay linea de tiempo, asi que sin una regla para `print` los
  // bloques se congelarian en su primer fotograma y saldrian vacios en el
  // papel. Es el unico caso donde una animacion guiada por scroll puede
  // hacer desaparecer contenido de verdad.
  await page.emulateMedia({ media: "print" });

  const animados = page.locator(".aparece, .aparece-lateral, .acercarse, .aparece-grupo > *");
  expect(await animados.count()).toBeGreaterThan(5);

  for (const elemento of await animados.all()) {
    const opacidad = await elemento.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacidad).toBe(1);
  }
});

test("quien pide menos movimiento no recibe ninguno", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "reduce" });
  const page = await contexto.newPage();
  await page.goto("/");

  // Con `prefers-reduced-motion`, las reglas de aparicion no se aplican. Lo que
  // importa es que el contenido se vea igual, y entero, desde el primer
  // instante.
  const bloques = page.locator(".aparece, .aparece-lateral, .acercarse");
  expect(await bloques.count()).toBeGreaterThan(0);

  for (const bloque of await bloques.all()) {
    const { opacidad, animacion } = await bloque.evaluate((el) => {
      const estilo = getComputedStyle(el);
      return { opacidad: Number(estilo.opacity), animacion: estilo.animationName };
    });
    expect(opacidad).toBe(1);
    expect(animacion).toBe("none");
  }

  await contexto.close();
});

test("el boton de pedido responde al pulsarlo", async ({ page }) => {
  await page.goto("/contacto");

  const boton = page.getByRole("main").locator("a.boton-cta").first();
  await expect(boton).toBeVisible();

  // El area tactil minima es un requisito, no una recomendacion (R15): el sitio
  // se usa desde el celular, muchas veces en la calle.
  const caja = await boton.boundingBox();
  expect(caja!.height).toBeGreaterThanOrEqual(44);

  // Y tiene transicion: sin ella, en un telefono no se sabe si el toque entro.
  const transicion = await boton.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transicion).not.toBe("0s");
});
