import { expect, test, type Page } from "@playwright/test";

/**
 * El area tactil minima de 44 px (R15, PRODUCT.md), en todo el sitio.
 *
 * Hasta el 11/09 solo se comprobaba en dos botones sueltos, y la medicion de
 * todas las paginas encontro 22 controles por debajo: los puntos del carrusel
 * (32), los enlaces del pie (36 y 20), los datos de contacto (17 a 20), el
 * zoom y el marcador del mapa (30 y 20). El sitio se usa desde el celular,
 * muchas veces en la calle. Esta prueba mide cada control de cada pagina en vez
 * de fiarse de que alguien se acuerde.
 *
 * Exentos, como en WCAG 2.5.8: un enlace dentro de una frase (su tamano es el
 * de la frase) y el credito de licencia del mapa, que es texto obligatorio.
 */

const RUTAS = [
  "/",
  "/productos",
  "/productos/leche",
  "/productos/frances-chico",
  "/novedades",
  "/nosotros",
  "/galeria",
  "/ubicacion",
  "/preguntas-frecuentes",
  "/contacto",
  "/esto-no-existe",
];

const SIN_ANIMACION = "*,*::before,*::after{animation:none!important;transition:none!important}";

async function controlesPequenos(page: Page) {
  return page.evaluate(() => {
    const selectores = "a[href], button, summary, [role='button'], input, select, textarea";

    return [...document.querySelectorAll(selectores)]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const estilo = getComputedStyle(el);
        // Lo que no se ve no se pulsa: fuera quedan lo oculto, lo apartado del
        // arbol de accesibilidad y el salto al contenido sin foco (`sr-only`).
        return (
          r.width > 0 &&
          r.height > 0 &&
          estilo.visibility !== "hidden" &&
          estilo.clipPath !== "inset(50%)" &&
          !el.closest("[aria-hidden='true']")
        );
      })
      .filter((el) => {
        const padre = el.parentElement;
        const enFrase =
          getComputedStyle(el).display === "inline" &&
          padre !== null &&
          (padre.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 3;
        return !enFrase && !el.closest(".leaflet-control-attribution");
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const texto = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
        return `"${texto.slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
      })
      .filter((descripcion) => {
        const [ancho, alto] = descripcion.split(" ").pop()!.split("x").map(Number);
        return ancho < 44 || alto < 44;
      });
  });
}

test("ningun control del sitio mide menos de 44 px en un celular", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El ancho que importa aqui es el de 375 px.");

  const fallos: string[] = [];
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await page.addStyleTag({ content: SIN_ANIMACION });
    if (ruta === "/ubicacion") {
      // El mapa llega en diferido: sin esperarlo, sus botones no se medirian.
      await expect(page.locator(".leaflet-control-zoom-in")).toBeVisible({ timeout: 20_000 });
    }
    for (const control of await controlesPequenos(page)) fallos.push(`${ruta} → ${control}`);
  }

  // La lista entera en el mensaje: un "esperaba 0, recibi 3" a secas obliga a
  // repetir la medicion a mano.
  expect(fallos, "Controles por debajo de 44 px:\n" + fallos.join("\n")).toEqual([]);
});

test("el salto al contenido tambien mide 44 px cuando aparece", async ({ page }) => {
  await page.goto("/");

  // Solo se ve al llegar con el teclado, pero ahi tiene que poder pulsarse.
  await page.keyboard.press("Tab");
  const salto = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(salto).toBeFocused();
  const caja = await salto.boundingBox();
  expect(caja!.height).toBeGreaterThanOrEqual(44);
});

test("el boton flotante se aparta mientras el de la pagina esta a la vista", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "El boton flotante solo existe en el celular.");
  const flotante = page.locator("a[data-flotante]");

  // En la ficha, el boton de pedir de la pagina esta arriba: el flotante sobra
  // y taparia el precio y las condiciones.
  await page.goto("/productos/leche");
  await expect(flotante).toHaveAttribute("aria-hidden", "true");
  await expect(flotante).toHaveCSS("opacity", "0");

  // Lejos de ese boton, vuelve.
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expect(flotante).not.toHaveAttribute("aria-hidden", "true");
  await expect(flotante).toHaveCSS("opacity", "1");

  // Y en una pagina sin boton propio esta desde el principio, tambien si se
  // llega navegando desde una donde estaba apartado.
  await page.goto("/productos/leche");
  await expect(flotante).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Abrir el menú" }).click();
  await page.getByRole("link", { name: "Nosotros" }).first().click();
  await expect(page).toHaveURL(/\/nosotros$/);
  await expect(flotante).toHaveCSS("opacity", "1");
});
