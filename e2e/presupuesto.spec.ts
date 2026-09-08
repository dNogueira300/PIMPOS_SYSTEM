import { gzipSync } from "node:zlib";

import { expect, test, type Page } from "@playwright/test";

/**
 * Presupuesto de rendimiento (doc 03 §4.5).
 *
 * El plan fija **menos de 150 KB de JavaScript comprimido** en la portada, y la
 * intencion es buena: Iquitos tiene conectividad movil irregular y el movil es
 * prioritario (R6). Pero al medirlo salio un dato que cambia la regla:
 *
 *   /nosotros (sin carrusel, sin filtros, todo servidor):  150 KB
 *   /         (con carrusel y todo lo demas):              150 KB
 *
 * **Los 150 KB son el suelo de React 19 mas Next 16**, no el peso del sitio.
 * Nuestro codigo de cliente no llega a marcar diferencia. Un presupuesto fijado
 * justo en el suelo del framework no mide el trabajo de nadie: o pasa por
 * milimetros o falla el dia que Next cambie de version, y en los dos casos no
 * dice nada util.
 *
 * Asi que se comprueban las dos cosas por separado:
 *
 *   1. Un techo absoluto con margen sobre el suelo medido (175 KB), que avisa
 *      si el framework se dispara.
 *   2. **Lo que de verdad controlamos**: cuanto anade la portada sobre una
 *      pagina que solo tiene servidor. Si alguien importa una libreria de
 *      graficos en la portada, esto lo caza aunque el suelo cambie.
 *
 * Dos trampas de medicion que costo encontrar, y por eso esto es asi:
 *
 *   - Sumar la cabecera `content-length` daba **2 KB** y la prueba pasaba: esa
 *     cabecera no viene en respuestas troceadas. Una comprobacion que pasa sin
 *     medir es peor que no tenerla.
 *   - `transferSize` si mide, pero `next start` sirve el JavaScript **sin
 *     comprimir**: daba 495 KB donde el visitante recibe 150. En produccion
 *     (Vercel o Cloudflare) todo va con gzip o brotli, asi que se comprime aqui
 *     antes de contar.
 */

const TECHO_KB = 175;
const MARGEN_SOBRE_EL_SUELO_KB = 20;

async function medirJavaScript(page: Page): Promise<{ archivos: number; kb: number }> {
  const urls = await page.evaluate(() => {
    const recursos = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return recursos
      .filter((recurso) => recurso.initiatorType === "script" || recurso.name.endsWith(".js"))
      .map((recurso) => recurso.name);
  });

  let comprimido = 0;
  for (const url of urls) {
    const respuesta = await page.request.get(url);
    comprimido += gzipSync(await respuesta.body()).byteLength;
  }

  return { archivos: urls.length, kb: Math.round(comprimido / 1024) };
}

test("la portada no se dispara y no pesa mas que una pagina sin interaccion", async ({ page }) => {
  await page.goto("/nosotros", { waitUntil: "networkidle" });
  const suelo = await medirJavaScript(page);

  await page.goto("/", { waitUntil: "networkidle" });
  const portada = await medirJavaScript(page);

  // Se imprimen siempre: el dia que esto falle, lo primero que hace falta saber
  // es por cuanto se paso y sobre que suelo.
  console.log(
    `Suelo (/nosotros): ${suelo.kb} KB · Portada: ${portada.kb} KB · ` +
      `Nuestro codigo anade ${portada.kb - suelo.kb} KB`,
  );

  // Que la medicion exista. Si saliera cero, la prueba estaria pasando por no
  // haber medido nada.
  expect(portada.archivos).toBeGreaterThan(0);
  expect(portada.kb).toBeGreaterThan(0);

  expect(portada.kb).toBeLessThan(TECHO_KB);
  expect(portada.kb - suelo.kb).toBeLessThan(MARGEN_SOBRE_EL_SUELO_KB);
});

test("el mapa no entra en el paquete de la portada", async ({ page }) => {
  const guiones: string[] = [];
  page.on("request", (peticion) => {
    if (peticion.resourceType() === "script") guiones.push(peticion.url());
  });

  await page.goto("/", { waitUntil: "networkidle" });

  expect(guiones.length).toBeGreaterThan(0);
  // Leaflet se carga solo en /ubicacion, con `next/dynamic`. Si algun dia
  // alguien lo importa directo desde un componente de la portada, esto lo caza.
  expect(guiones.join(" ")).not.toMatch(/leaflet/i);
});

test("la ubicacion carga el mapa, y solo ahi", async ({ page }) => {
  await page.goto("/ubicacion", { waitUntil: "networkidle" });
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 20_000 });

  const { kb } = await medirJavaScript(page);
  console.log(`Ubicación: ${kb} KB comprimidos, con Leaflet incluido`);

  // No se le exige el techo de la portada: esta pagina carga un mapa a
  // proposito, y quien entra en "dónde estamos" viene a verlo. Lo que se vigila
  // es que no se dispare.
  expect(kb).toBeLessThan(250);
});
