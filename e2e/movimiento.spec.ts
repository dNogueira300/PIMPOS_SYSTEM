import { expect, test, type Page } from "@playwright/test";

/**
 * El movimiento del sitio y el horario.
 *
 * Lo que se vigila aqui no es que "se vea bonito" sino lo unico que puede
 * romperse de verdad: que una animacion deje un texto invisible, y que el
 * horario se lea de un vistazo en un telefono.
 */

const ANIMADOS = ".aparece, .aparece-lateral, .acercarse, .aparece-grupo > *";

test("el horario junta los dias iguales y pone cada turno en su propia linea", async ({ page }) => {
  await page.goto("/contacto");
  const principal = page.getByRole("main");

  // Siete filas casi identicas eran el horario (critica del 11/09): de lunes a
  // sabado se abre igual. Se lee "Lunes a sábado" una vez, no seis dias sueltos.
  await expect(principal.getByText("Martes", { exact: true })).toHaveCount(0);

  // La primera version unia los dos turnos con un "y" en medio. En un telefono
  // la linea se partia justo por la hora de cierre y quedaba "4:00 p. m. a"
  // arriba y "9:00 p. m." abajo, que se lee como un error.
  const lunes = principal.locator("dl div").filter({ hasText: "Lunes a sábado" }).first();

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

test("las preguntas frecuentes dan el horario como el resto del sitio", async ({ page }) => {
  await page.goto("/preguntas-frecuentes");

  // Antes decian "de 4:00 a 13:00": el mismo dato en otro formato, en el mismo
  // sitio, hace dudar de cual es el bueno. Lo corrigio la migracion 0018.
  const pregunta = page.locator("details").filter({ hasText: "horarios de atención" });
  await pregunta.locator("summary").click();
  await expect(pregunta).toContainText("4:00 a. m. a 1:00 p. m.");
  await expect(pregunta).not.toContainText("13:00");
});

test("todo lo animado acaba visible al llegar a el", async ({ page }) => {
  await page.goto("/");

  // El riesgo real de animar la aparicion de bloques es que uno se quede a
  // medias y su contenido no llegue a verse nunca. Un bloque que todavia no ha
  // entrado en pantalla SI empieza en opacidad cero: eso es la animacion, no un
  // fallo. Lo que hay que comprobar es que al llegar a el, se ve.
  //
  // OJO con lo que esta prueba NO cubre: centra cada bloque en pantalla antes de
  // medirlo, asi que nunca ve lo que ve una persona que deja de hacer scroll. Por
  // eso durante un tiempo el sitio tuvo precios y argumentos de venta a opacidad
  // 0.1-0.7 con la pagina quieta, y esta prueba seguia en verde. Lo cubre la
  // prueba de reposo de mas abajo.
  const animados = page.locator(ANIMADOS);
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

/**
 * Deja la pagina quieta a una altura y devuelve los bloques animados que estan
 * enteros dentro de la pantalla pero todavia no son opacos.
 *
 * Es la medicion que faltaba: sin centrar nada, sin ayudar a la animacion. Lo
 * que ve alguien que baja un poco y se para a leer un precio.
 */
async function flojosEnReposo(page: Page, y: number): Promise<string[]> {
  await page.evaluate((destino) => window.scrollTo({ top: destino, behavior: "instant" }), y);
  // Dos fotogramas: la linea de tiempo del scroll se recalcula en el siguiente.
  await page.evaluate(
    () =>
      new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(() => listo(null)))),
  );

  return page.evaluate((selector) => {
    const alto = window.innerHeight;
    const real = Math.round(window.scrollY);
    const flojos: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const caja = el.getBoundingClientRect();
      const enteroDentro = caja.height > 0 && caja.top >= 0 && caja.bottom <= alto;
      if (!enteroDentro) continue;
      const opacidad = Number(getComputedStyle(el).opacity);
      if (opacidad < 0.95) {
        const texto = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
        flojos.push(`y=${real} ${opacidad.toFixed(2)} «${texto || el.className}»`);
      }
    }
    return flojos;
  }, ANIMADOS);
}

test("con la pagina quieta, nada de lo que se ve entero queda a medio aparecer", async ({
  page,
}) => {
  const flojos: string[] = [];

  for (const ruta of ["/", "/productos", "/nosotros", "/galeria"]) {
    await page.goto(ruta);
    const maximo = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    // Arriba del todo (lo que ve quien entra y no toca nada), varias alturas
    // intermedias y el final de la pagina.
    const alturas = [
      ...new Set([0, 700, 1400, 2100, 2800, maximo].map((y) => Math.min(y, maximo))),
    ];

    for (const y of alturas) {
      for (const flojo of await flojosEnReposo(page, y)) flojos.push(`${ruta} ${flojo}`);
    }
  }

  expect(
    flojos,
    "Bloques enteros en pantalla pero semitransparentes:\n" + flojos.join("\n"),
  ).toEqual([]);
});

test("la aparicion sigue ahi: un bloque que esta entrando se ve a medio camino", async ({
  page,
}) => {
  // La otra cara de la prueba de reposo. Arreglar que nada se quede a medias es
  // facil si se rompe el movimiento entero: basta con que la animacion termine
  // al instante, y todas las demas pruebas seguirian en verde porque solo
  // miran que el contenido se vea. Esta mira que siga habiendo movimiento, que
  // es lo que se pidio: el sitio estaba demasiado estatico.
  await page.goto("/");
  const maximo = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const dosFotogramas = () =>
    page.evaluate(
      () =>
        new Promise((listo) =>
          requestAnimationFrame(() => requestAnimationFrame(() => listo(null))),
        ),
    );

  let hallado: { indice: number; opacidad: number; texto: string } | null = null;

  for (let y = 0; y <= maximo && hallado === null; y += 150) {
    await page.evaluate((destino) => window.scrollTo({ top: destino, behavior: "instant" }), y);
    await dosFotogramas();

    hallado = await page.evaluate((selector) => {
      const alto = window.innerHeight;
      const todos = [...document.querySelectorAll<HTMLElement>(selector)];
      for (const [indice, el] of todos.entries()) {
        const caja = el.getBoundingClientRect();
        // Asomando por abajo: una parte dentro, otra todavia fuera.
        const entrando = caja.height > 0 && caja.top < alto && caja.bottom > alto;
        const opacidad = Number(getComputedStyle(el).opacity);
        if (entrando && opacidad > 0.02 && opacidad < 0.98) {
          return { indice, opacidad, texto: (el.textContent ?? "").trim().slice(0, 30) };
        }
      }
      return null;
    }, ANIMADOS);
  }

  expect(
    hallado,
    "Ningun bloque se vio a medio aparecer al bajar: el movimiento ya no existe",
  ).not.toBeNull();

  // Y que esa transparencia sea de verdad la animacion de aparicion y no otra
  // cosa (una transicion, un color con alfa). Se apagan las animaciones sin
  // mover la pagina: el mismo bloque tiene que pasar a opaco. Si no, esta prueba
  // estaria dando por bueno un movimiento que no existe, que es exactamente el
  // tipo de prueba que ya nos engano una vez.
  await page.addStyleTag({ content: `${ANIMADOS} { animation: none !important; }` });
  await dosFotogramas();
  const sinAnimacion = await page.evaluate(
    ({ selector, indice }) =>
      Number(getComputedStyle(document.querySelectorAll<HTMLElement>(selector)[indice]).opacity),
    { selector: ANIMADOS, indice: hallado!.indice },
  );
  expect(sinAnimacion, `«${hallado!.texto}» estaba a ${hallado!.opacidad.toFixed(2)}`).toBe(1);
});

test("al imprimir no queda ningun bloque en blanco", async ({ page }) => {
  await page.goto("/");
  // Sin scroll no hay linea de tiempo, asi que sin una regla para `print` los
  // bloques se congelarian en su primer fotograma y saldrian vacios en el
  // papel. Es el unico caso donde una animacion guiada por scroll puede
  // hacer desaparecer contenido de verdad.
  await page.emulateMedia({ media: "print" });

  const animados = page.locator(ANIMADOS);
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
