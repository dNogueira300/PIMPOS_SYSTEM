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
  await expect(flotante).toHaveCSS("opacity", "1");

  // Bajando, se aparta: es cuando se come la linea que el cliente esta leyendo.
  await page.mouse.wheel(0, 1200);
  await expect(flotante).toHaveCSS("opacity", "0");

  // Y vuelve solo al parar, sin que haya que buscarlo (R4).
  await expect(flotante).toHaveCSS("opacity", "1", { timeout: 5000 });

  // Subiendo tambien esta: es el gesto de quien busca el boton.
  await page.mouse.wheel(0, 1200);
  await page.mouse.wheel(0, -300);
  await expect(flotante).toHaveCSS("opacity", "1");
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
