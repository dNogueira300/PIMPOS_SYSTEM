import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AA, contraste } from "@/lib/utilidades/contraste";

/**
 * Comprueba la accesibilidad del sistema de diseno leyendo `globals.css` de
 * verdad, no una copia de los valores.
 *
 * El motivo: la accesibilidad AA es un minimo del proyecto (doc 03 §3.4), y
 * hasta ahora era una afirmacion en un comentario. Si alguien ajusta un color
 * y rompe un contraste, esto falla en el commit en vez de descubrirse con un
 * lector de pantalla meses despues.
 */

const CSS = readFileSync(join(process.cwd(), "src/estilos/globals.css"), "utf8");

/** Lee el valor de un primitivo (`--pimpos-*`), que siempre es un hex literal. */
function primitivo(nombre: string): string {
  const encontrado = new RegExp(`--pimpos-${nombre}:\\s*(#[0-9a-fA-F]{3,8});`).exec(CSS);
  if (!encontrado) {
    throw new Error(`No se encontro el primitivo --pimpos-${nombre} en globals.css`);
  }
  return encontrado[1];
}

const c = {
  azul900: primitivo("azul-900"),
  azul600: primitivo("azul-600"),
  azul200: primitivo("azul-200"),
  crema50: primitivo("crema-50"),
  crema100: primitivo("crema-100"),
  crema200: primitivo("crema-200"),
  dorado500: primitivo("dorado-500"),
  dorado700: primitivo("dorado-700"),
  dorado300: primitivo("dorado-300"),
  tinta900: primitivo("tinta-900"),
  tinta700: primitivo("tinta-700"),
  tinta500: primitivo("tinta-500"),
  noche900: primitivo("noche-900"),
  noche700: primitivo("noche-700"),
  noche500: primitivo("noche-500"),
  noche200: primitivo("noche-200"),
  exito600: primitivo("exito-600"),
  alerta600: primitivo("alerta-600"),
  peligro600: primitivo("peligro-600"),
  exito300: primitivo("exito-300"),
  peligro300: primitivo("peligro-300"),
};

/** [frente, fondo, umbral, para que se usa] */
type Par = [string, string, number, string];

const PARES_CLARO: Par[] = [
  [c.tinta900, c.crema100, AA.texto, "texto principal sobre el fondo de página"],
  [c.tinta900, c.crema50, AA.texto, "texto sobre tarjetas y diálogos"],
  [c.tinta700, c.crema100, AA.texto, "texto secundario (muted-foreground)"],
  [c.azul900, c.crema100, AA.texto, "títulos y enlaces institucionales"],
  [c.crema50, c.azul900, AA.texto, "texto sobre el botón primario"],
  [c.crema50, c.azul600, AA.texto, "texto sobre el azul de fachada"],
  [c.tinta900, c.dorado500, AA.texto, "texto sobre la llamada a la acción dorada"],
  [c.dorado700, c.crema100, AA.texto, "el dorado cuando hace de texto o precio"],
  [c.dorado700, c.crema50, AA.texto, "precio sobre la tarjeta de producto"],
  [c.peligro600, c.crema100, AA.texto, "mensajes de error"],
  [c.exito600, c.crema100, AA.texto, "mensajes de éxito"],
  [c.alerta600, c.crema100, AA.texto, "avisos de stock y vencimiento"],
  [c.tinta500, c.crema100, AA.interfaz, "bordes de campos y controles"],
  [c.azul600, c.crema100, AA.interfaz, "anillo de foco"],
];

const PARES_OSCURO: Par[] = [
  [c.crema50, c.noche900, AA.texto, "texto principal sobre fondo oscuro"],
  [c.crema50, c.noche700, AA.texto, "texto sobre tarjeta oscura"],
  [c.noche200, c.noche900, AA.texto, "texto secundario en oscuro"],
  [c.azul200, c.noche900, AA.texto, "enlaces en oscuro"],
  [c.noche900, c.azul200, AA.texto, "texto sobre el botón primario en oscuro"],
  [c.dorado300, c.noche900, AA.texto, "el dorado en oscuro"],
  [c.peligro300, c.noche900, AA.texto, "errores en oscuro"],
  [c.exito300, c.noche900, AA.texto, "éxitos en oscuro"],
  [c.noche500, c.noche900, AA.interfaz, "bordes en oscuro"],
];

describe("paleta — tema claro", () => {
  it.each(PARES_CLARO)("%s sobre %s cumple AA (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

describe("paleta — tema oscuro", () => {
  it.each(PARES_OSCURO)("%s sobre %s cumple AA (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

describe("reglas de uso del dorado", () => {
  it("el dorado de marca NO sirve como texto sobre crema, ni siquiera grande", () => {
    // La regla del plan (doc 03 §3.4) era "solo en superficies grandes, iconos
    // o texto de 18 px o mas". Medido, no llega ni a eso: 2.80 frente a un
    // minimo de 3.0. Por eso existe dorado-700, y por eso esta prueba fija la
    // regla corregida en lugar de la original.
    expect(contraste(c.dorado500, c.crema100)).toBeLessThan(AA.textoGrande);
  });

  it("el dorado de marca sí sirve como fondo, con tinta encima", () => {
    expect(contraste(c.tinta900, c.dorado500)).toBeGreaterThanOrEqual(AA.texto);
  });

  it("pero NO con blanco encima", () => {
    // El reflejo habitual seria poner texto blanco sobre el boton dorado.
    expect(contraste("#FFFFFF", c.dorado500)).toBeLessThan(AA.texto);
  });
});

describe("el fondo nunca es blanco puro", () => {
  it("la crema de fondo y la de superficie se distinguen del blanco", () => {
    // Regla de marca (docs/marca.md §8): el blanco puro rompe el tono cálido.
    expect(c.crema100.toLowerCase()).not.toBe("#ffffff");
    expect(c.crema50.toLowerCase()).not.toBe("#ffffff");
    // Y entre ellas tiene que haber diferencia visible, o las tarjetas no se
    // separan del fondo.
    expect(contraste(c.crema50, c.crema100)).toBeGreaterThan(1.02);
  });
});
