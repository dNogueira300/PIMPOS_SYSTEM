import { expect, test, type Page } from "@playwright/test";

/**
 * El boton flotante de WhatsApp no puede taparle el texto al cliente
 * (critica del 12/09/2026, P1).
 *
 * Medido entonces: tapaba «Se hornea y se vende el mismo día» en el primer
 * pliegue de la portada, el `h2` «Panes integrales» del catalogo, la quinta
 * pregunta del FAQ, el titulo del 404 y parte de la primera foto de la galeria.
 *
 * Sigue siendo permanente (R4): no se quita, se aparta. Vuelve en cuanto el
 * cliente deja de bajar, sube, o no hay un boton de pedir a la vista.
 */

const RUTAS = ["/", "/productos", "/preguntas-frecuentes", "/galeria", "/esto-no-existe"];

/** Que hay justo debajo del centro del boton flotante. */
async function loQueTapa(page: Page) {
  return page.evaluate(() => {
    const boton = document.querySelector("a[data-flotante]");
    if (!boton) return { hayBoton: false, texto: "" };

    const caja = boton.getBoundingClientRect();
    const x = caja.left + caja.width / 2;
    const y = caja.top + caja.height / 2;

    // `pointer-events: none` mientras esta apartado ya deja pasar el punto; para
    // el resto se oculta un instante, se mira que hay debajo y se restaura.
    const antes = (boton as HTMLElement).style.visibility;
    (boton as HTMLElement).style.visibility = "hidden";
    const debajo = document.elementFromPoint(x, y);
    (boton as HTMLElement).style.visibility = antes;

    if (!debajo) return { hayBoton: true, texto: "" };

    // Solo cuenta el texto del propio nodo, no el de sus hijos: un `section`
    // enorme "contiene" todo el texto de la pagina sin que el boton lo tape.
    const propio = [...debajo.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => (n.textContent ?? "").trim())
      .join(" ")
      .trim();

    return { hayBoton: true, texto: propio.slice(0, 60) };
  });
}

test("al final de la pagina, el flotante no se queda encima de ningun texto", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "El boton flotante solo existe en el celular.");

  const tapados: string[] = [];
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}",
    });

    // Al fondo del documento es donde el tapado seria permanente: no hay mas
    // scroll con el que apartar el contenido de debajo.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    const { hayBoton, texto } = await loQueTapa(page);
    expect(hayBoton, `no hay boton flotante en ${ruta}`).toBe(true);
    if (texto.length > 0) tapados.push(`${ruta} → "${texto}"`);
  }

  expect(tapados, "El flotante tapa texto al final de:\n" + tapados.join("\n")).toEqual([]);
});

test("el flotante se aparta mientras se baja y vuelve al parar", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El boton flotante solo existe en el celular.");

  await page.goto("/productos");
  const flotante = page.locator("a[data-flotante]");
  await expect(flotante).not.toHaveAttribute("aria-hidden", "true");

  /**
   * Mueve la pagina y devuelve el estado del boton en ESE instante.
   *
   * Medirlo desde fuera era una carrera perdida: el boton vuelve solo a los
   * 500 ms y la comprobacion llegaba tarde, asi que la prueba fallaba sin que
   * nada estuviera roto. Congelar el reloj tampoco sirve: el evento de scroll
   * llega despues de adelantar el tiempo, y el `requestAnimationFrame` del
   * manejador se queda pendiente sin que nadie lo corra. Se mide dentro del
   * navegador, en el mismo turno del gesto.
   *
   * Se mira `aria-hidden` y no la opacidad porque cambia en el mismo instante,
   * sin pasar por la transicion de 200 ms. Que ademas se VEA apartado lo
   * comprueba la prueba siguiente, donde el estado es estable.
   */
  const alMover = (pixeles: number) =>
    page.evaluate(async (cuanto) => {
      const antes = window.scrollY;
      window.scrollBy(0, cuanto);
      // Dos fotogramas: el manejador hace su cuenta dentro de un
      // `requestAnimationFrame`, y React pinta en el siguiente.
      await new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo)));
      return {
        // Sin movimiento no hay gesto que detectar, y el boton tiene razon en
        // quedarse. Se devuelve para que un fallo lo diga en vez de acusar al
        // boton de algo que no hizo.
        movio: window.scrollY !== antes,
        estado: document.querySelector("a[data-flotante]")?.getAttribute("aria-hidden") ?? null,
      };
    }, pixeles);

  // Con la suite entera en paralelo, la pagina puede medirse antes de tener
  // alto suficiente: entonces `scrollBy` no mueve nada y la prueba fallaba
  // culpando al boton. Primero se espera a que haya recorrido de verdad.
  await page.waitForFunction(() => document.body.scrollHeight > window.innerHeight + 900);

  // Bajando se aparta: es cuando se come la linea que el cliente esta leyendo.
  const bajando = await alMover(800);
  expect(bajando.movio, "la pagina no tenia recorrido para bajar").toBe(true);
  expect(bajando.estado).toBe("true");

  // Y vuelve solo al parar, sin que haya que buscarlo (R4). Aqui el estado ya
  // es estable, asi que si se puede esperar por el.
  await expect(flotante).not.toHaveAttribute("aria-hidden", "true", { timeout: 5000 });

  // Subiendo tambien esta: es el gesto de quien busca el boton.
  expect((await alMover(800)).estado).toBe("true");
  expect((await alMover(-300)).estado).toBeNull();
});

test("el flotante se aparta con cualquier boton de WhatsApp a la vista", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "El boton flotante solo existe en el celular.");
  const flotante = page.locator("a[data-flotante]");

  // El de la propia pagina, como ya se comprobaba.
  await page.goto("/productos/leche");
  await expect(flotante).toHaveAttribute("aria-hidden", "true");
  await expect(flotante).toHaveCSS("opacity", "0");

  // Y el del menu desplegable, que antes no contaba: al abrirlo quedaban dos
  // botones de pedir en la misma pantalla.
  await page.goto("/galeria");
  await expect(flotante).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Abrir el menú" }).click();
  await expect(
    page.locator("#menu-movil").getByRole("link", { name: "Pedir por WhatsApp" }),
  ).toBeVisible();
  await expect(flotante).toHaveCSS("opacity", "0");
});
