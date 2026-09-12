import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * axe en todas las paginas publicas (doc 03 §6 y §7: "sin errores de axe en
 * ninguna pagina").
 *
 * Hasta ahora la accesibilidad se comprobaba a trozos: el contraste con Vitest,
 * el area tactil con `tactil.spec.ts`, los roles de cada pieza dentro de su
 * propia prueba. Todo eso sigue valiendo —axe no mide el area tactil, ni el
 * contraste de un texto sobre una foto— pero dejaba fuera la familia entera de
 * fallos estructurales: un elemento fuera de toda region, dos `nav` con el
 * mismo nombre, un `<dl>` mal formado, un `aria-*` que no existe.
 *
 * Una prueba por ruta, no una que las recorra todas. Recorriendolas se pasaba
 * de los 30 s de Playwright en cuanto la suite entera corria en paralelo, y
 * ademas el nombre de la prueba que falla ya dice en que pagina mirar.
 *
 * Se ejecuta en los dos tamanos porque el DOM no es el mismo: en el celular la
 * portada no lleva carrusel y la cabecera trae el menu desplegable.
 *
 * **No se desactiva ninguna regla.** Si una salta, o es un fallo real o hay que
 * escribir aqui por que no lo es, con su motivo. Una exclusion sin motivo
 * escrito es deuda invisible.
 */

// Las 8 secciones publicas, mas una ficha de producto de cada forma (con foto y
// sin ella), una novedad, y las dos paginas que no son "contenido" pero las ve
// cualquiera: el 404 y la pantalla de ingreso.
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
  "/ingresar",
];

// WCAG 2.1 AA, que es el nivel que declara PRODUCT.md, mas las buenas practicas
// de axe (nombres de region, orden de encabezados): son las que cazan lo que un
// lector de pantalla convierte en un laberinto sin llegar a incumplir la norma.
const NORMAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

/**
 * Las animaciones, apagadas antes de medir.
 *
 * No es cosmetico. La aparicion por scroll pasa por opacidades intermedias, y
 * Lighthouse llego a marcar un contraste de 4.28 sobre un enlace cuyo color
 * real da 5.06: era el token de siempre (`#8f5a10`) a 0.913 de opacidad sobre
 * el crema, o sea la animacion a medio camino. Medir eso es medir un fotograma,
 * no un color.
 */
const SIN_ANIMACION = "*,*::before,*::after{animation:none!important;transition:none!important}";

/** Un fallo de axe, con lo necesario para arreglarlo sin volver a medir. */
function describir(violacion: { id: string; help: string; nodes: unknown[] }) {
  const nodos = violacion.nodes as { target: unknown[]; failureSummary?: string }[];
  const donde = nodos
    .slice(0, 3)
    .map((n) => {
      // El resumen de axe es lo que distingue "este `nav` no tiene nombre" de
      // "este `nav` tiene el mismo nombre que otro".
      const motivo = (n.failureSummary ?? "").split("\n").slice(1).join(" ").trim();
      return `      ${String(n.target)}${motivo ? `\n        ${motivo}` : ""}`;
    })
    .join("\n");
  const resto = nodos.length > 3 ? `\n      ...y ${nodos.length - 3} mas` : "";
  return `  [${violacion.id}] ${violacion.help}\n${donde}${resto}`;
}

async function exigirCero(page: Page, donde: string) {
  const resultado = await new AxeBuilder({ page }).withTags(NORMAS).analyze();
  const fallos = resultado.violations.map(describir);

  // La lista entera en el mensaje: "esperaba 0, recibi 4" obliga a repetir la
  // medicion a mano para saber cual de las cuatro.
  expect(
    fallos,
    `axe encontró ${fallos.length} problema(s) en ${donde}:\n${fallos.join("\n")}`,
  ).toEqual([]);
}

for (const ruta of RUTAS) {
  test(`sin errores de axe en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await page.addStyleTag({ content: SIN_ANIMACION });

    if (ruta === "/ubicacion") {
      // El mapa llega en diferido. Sin esperarlo se analizaria el hueco vacio y
      // los controles de Leaflet —que son los que mas probabilidades tienen de
      // fallar, porque no los escribimos nosotros— quedarian sin mirar.
      await expect(page.locator(".leaflet-control-zoom-in")).toBeVisible({ timeout: 20_000 });
    }

    await exigirCero(page, ruta);
  });
}

test("sin errores de axe con el menú del celular abierto", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menú desplegable solo existe en el celular.");

  // Con el menu cerrado sus enlaces no estan en el DOM: las pruebas de arriba
  // nunca los miran. Y es la unica pieza del sitio que atrapa el foco.
  await page.goto("/");
  await page.addStyleTag({ content: SIN_ANIMACION });
  await page.getByRole("button", { name: "Abrir el menú" }).click();
  await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();

  await exigirCero(page, "la portada con el menú abierto");
});
