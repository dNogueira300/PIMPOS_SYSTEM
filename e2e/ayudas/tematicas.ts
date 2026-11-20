import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

import { sqlLocal } from "./base";

/**
 * Aparta las demás temáticas mientras una prueba enciende `slug`.
 *
 * Encender una temática a mano vale «desde hoy hasta su fin», y la base no deja
 * que dos se crucen (0047): según el día en que corra la prueba, las fechas de
 * fábrica de otra (el Día de la Madre en abril, Navidad en diciembre) harían
 * que el panel respondiera «Las fechas se cruzan con…» sin que nada estuviera
 * roto. Las lleva lejos (dentro de más de un año, sin fecha de la fiesta), cada
 * una a su propia semana para que no se crucen entre ellas, y devuelve una
 * función que las deja como estaban. Esa función se llama al final, DESPUÉS de
 * devolver la temática probada a sus fechas: si no, podría cruzarse con ella.
 *
 * Halloween y el Día de la Canción Criolla comparten fechas y una va apagada
 * (0050): al devolverlas, primero las apagadas, que siguen apagadas, y después
 * las demás, en «según fechas».
 *
 * Solo prepara datos: lo que la prueba comprueba se enciende desde el panel.
 */
export function apartarLasDemas(slug: string): () => void {
  const filas = sqlLocal(
    `select concat_ws('|', slug, inicio, fin, coalesce(fecha_evento::text, ''), encendido)
       from public.tematicas where slug <> '${slug}' order by slug`,
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((linea) => linea.trim().split("|"));

  filas.forEach(([otra], i) => {
    sqlLocal(`
      update public.tematicas
         set inicio = ((now() at time zone 'America/Lima')::date + ${400 + 20 * i}),
             fin = ((now() at time zone 'America/Lima')::date + ${410 + 20 * i}),
             fecha_evento = null
       where slug = '${otra}';
    `);
  });

  return () => {
    const apagadas = filas.filter(([, , , , encendido]) => encendido === "apagada");
    const demas = filas.filter(([, , , , encendido]) => encendido !== "apagada");
    for (const [otra, inicio, fin, evento] of apagadas) {
      sqlLocal(`
        update public.tematicas
           set encendido = 'apagada', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date
         where slug = '${otra}';
      `);
    }
    for (const [otra, inicio, fin, evento] of demas) {
      sqlLocal(`
        update public.tematicas
           set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date
         where slug = '${otra}';
      `);
    }
  };
}

/*
 * Lo común de las pruebas que encienden una temática (Navidad, Día de la
 * Madre): fechas relativas a hoy, axe en todas las páginas públicas y lo que
 * mira el movimiento y la impresión.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
/** «2026-11-25»: hoy en Iquitos más `dias`. */
export function dia(dias: number): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000 + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Las páginas públicas de `accesibilidad.spec.ts`: el estilo cambia el color de todas. */
export const RUTAS = [
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

const NORMAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];
const SIN_ANIMACION = "*,*::before,*::after{animation:none!important;transition:none!important}";

export async function exigirCeroAxe(page: Page, donde: string) {
  await page.addStyleTag({ content: SIN_ANIMACION });
  const { violations } = await new AxeBuilder({ page }).withTags(NORMAS).analyze();
  const fallos = violations.map(
    (v) =>
      `[${v.id}] ${v.help}: ${v.nodes
        .slice(0, 3)
        .map((n) => String(n.target))
        .join(", ")}`,
  );
  expect(fallos, `axe en ${donde}:\n${fallos.join("\n")}`).toEqual([]);
}

/** axe en todas las páginas públicas con la temática puesta. */
export async function axeEnRutas(page: Page, donde: string) {
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    if (ruta === "/ubicacion") {
      // El mapa llega en diferido: sin esperarlo, sus controles quedarían sin mirar.
      await expect(page.locator(".leaflet-control-zoom-in")).toBeVisible({ timeout: 20_000 });
    }
    await exigirCeroAxe(page, `${ruta} ${donde}`);
  }
}

/*
 * Las dos funciones que siguen corren DENTRO del navegador (`page.evaluate`):
 * no pueden usar nada de fuera de su cuerpo.
 */

/** Todo lo que se está animando en la página, seudoelementos incluidos. */
export function listarAnimados() {
  const animados: string[] = [];
  for (const el of document.querySelectorAll("*")) {
    for (const seudo of [undefined, "::before", "::after"]) {
      const nombre = getComputedStyle(el, seudo).animationName;
      if (nombre !== "none") {
        animados.push(`${el.tagName.toLowerCase()}.${el.className}${seudo ?? ""}: ${nombre}`);
      }
    }
  }
  return animados;
}

/** Los adornos de la temática que se ven (sirve para comprobar la impresión). */
export function listarAdornosVisibles() {
  const envoltura = document.querySelector("[data-tematica]");
  const cabecera = document.querySelector("[data-tematica] header");
  if (!envoltura || !cabecera) throw new Error("No hay temática puesta");
  const piezas: [string, Element | null, string | undefined][] = [
    ["envoltura::before", envoltura, "::before"],
    ["envoltura::after", envoltura, "::after"],
    ["header::before", cabecera, "::before"],
    ["header::after", cabecera, "::after"],
    ["la sección de temporada::before", document.querySelector(".seccion-temporada"), "::before"],
    ...[...cabecera.querySelectorAll(".adornos-tematica")].map(
      (el): [string, Element, undefined] => [".adornos-tematica", el, undefined],
    ),
  ];
  return piezas
    .filter(([, el, seudo]) => {
      if (!el) return false;
      const estilo = getComputedStyle(el, seudo);
      return estilo.display !== "none" && estilo.content !== "none";
    })
    .map(([nombre]) => nombre);
}
