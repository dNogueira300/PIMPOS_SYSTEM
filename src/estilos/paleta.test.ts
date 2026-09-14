import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AA, aCanales, contraste } from "@/lib/utilidades/contraste";

/**
 * Comprueba la accesibilidad del sistema de diseno leyendo `globals.css` de
 * verdad, no una copia de los valores.
 *
 * El motivo: la accesibilidad AA es un minimo del proyecto (doc 03 §3.4), y
 * hasta F1 era una afirmacion en un comentario. Si alguien ajusta un color y
 * rompe un contraste, esto falla en el commit en vez de descubrirse con un
 * lector de pantalla meses despues.
 *
 * Desde la fase 3.1 (plan 03.1, tarea 2) la paleta es la del prototipo de
 * Stitch con el azul institucional. Las parejas nuevas —verde de WhatsApp,
 * terracota de la barra de aviso, franja durazno, el velo del hero— se suman a
 * las de F1, que se conservan: el tema oscuro y los colores de estado siguen
 * existiendo aunque la portada no los enseñe.
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

/** `frente` pintado con opacidad `alfa` sobre `fondo`, como lo compone el navegador. */
function mezclar(frente: string, fondo: string, alfa: number): string {
  const f = aCanales(frente);
  const b = aCanales(fondo);
  return (
    "#" +
    f
      .map((canal, i) => Math.round(canal * alfa + b[i] * (1 - alfa)))
      .map((canal) => canal.toString(16).padStart(2, "0"))
      .join("")
  );
}

const c = {
  azul900: primitivo("azul-900"),
  azul800: primitivo("azul-800"),
  azul600: primitivo("azul-600"),
  azul200: primitivo("azul-200"),
  crema0: primitivo("crema-0"),
  crema50: primitivo("crema-50"),
  crema100: primitivo("crema-100"),
  crema200: primitivo("crema-200"),
  dorado300: primitivo("dorado-300"),
  dorado500: primitivo("dorado-500"),
  dorado800: primitivo("dorado-800"),
  dorado900: primitivo("dorado-900"),
  terracota800: primitivo("terracota-800"),
  verde700: primitivo("verde-700"),
  verde800: primitivo("verde-800"),
  tinta900: primitivo("tinta-900"),
  tinta600: primitivo("tinta-600"),
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

/**
 * El peor caso del hero de escritorio: un pixel negro debajo del velo crema,
 * a la opacidad minima que declara `--velo-hero` (0.85).
 */
const VELO_SOBRE_NEGRO = mezclar(c.crema50, "#000000", 0.85);

/** [frente, fondo, umbral, para que se usa] */
type Par = [string, string, number, string];

const PARES_CLARO: Par[] = [
  [c.tinta900, c.crema50, AA.texto, "texto principal sobre el fondo de página"],
  [c.tinta900, c.crema0, AA.texto, "texto sobre tarjetas y diálogos"],
  [c.tinta600, c.crema50, AA.texto, "texto secundario (muted-foreground) sobre el fondo"],
  [c.tinta600, c.crema100, AA.texto, "texto secundario sobre sección alterna"],
  [c.azul900, c.crema50, AA.texto, "títulos y enlaces institucionales"],
  [c.azul900, c.crema200, AA.texto, "títulos sobre sección apagada"],
  [c.crema50, c.azul900, AA.texto, "texto sobre el botón azul"],
  [c.crema50, c.azul800, AA.texto, "texto sobre el botón azul al pasar"],
  [c.crema50, c.azul600, AA.texto, "texto sobre el azul de fachada"],
  [c.tinta900, c.dorado500, AA.texto, "texto sobre un fondo dorado claro"],
  [c.crema50, c.dorado800, AA.texto, "texto sobre el botón marrón"],
  [c.crema50, c.dorado900, AA.texto, "texto sobre el botón marrón al pasar"],
  [c.dorado800, c.crema50, AA.texto, "el dorado cuando hace de texto o precio"],
  [c.dorado800, c.crema0, AA.texto, "precio sobre la tarjeta de producto"],
  [c.dorado800, c.crema100, AA.texto, "texto de los sellos"],
  [c.crema0, c.verde700, AA.texto, "texto sobre el botón de WhatsApp"],
  [c.crema0, c.verde800, AA.texto, "texto sobre el botón de WhatsApp al pasar"],
  [c.crema50, c.terracota800, AA.texto, "texto de la barra de aviso"],
  [c.tinta900, c.dorado300, AA.texto, "texto de la franja de confianza"],
  [mezclar(c.tinta900, c.dorado300, 0.8), c.dorado300, AA.texto, "detalle de la franja al 80 %"],
  [c.azul900, VELO_SOBRE_NEGRO, AA.texto, "titular del hero sobre el velo, peor caso"],
  [c.tinta600, VELO_SOBRE_NEGRO, AA.texto, "subtítulo del hero sobre el velo, peor caso"],
  [c.peligro600, c.crema50, AA.texto, "mensajes de error"],
  [c.exito600, c.crema50, AA.texto, "mensajes de éxito"],
  [c.alerta600, c.crema50, AA.texto, "avisos de stock y vencimiento"],
  [c.tinta500, c.crema0, AA.interfaz, "bordes de campos y controles"],
  [c.azul600, c.crema50, AA.interfaz, "anillo de foco"],
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
  it("el dorado claro NO sirve como texto sobre crema, ni siquiera grande", () => {
    // La regla del plan (doc 03 §3.4) era "solo en superficies grandes, iconos
    // o texto de 18 px o mas". Medido, no llega ni a eso. Por eso el dorado que
    // hace de texto es dorado-800, y esta prueba fija la regla corregida.
    expect(contraste(c.dorado500, c.crema50)).toBeLessThan(AA.textoGrande);
  });

  it("el dorado claro sí sirve como fondo, con tinta encima", () => {
    expect(contraste(c.tinta900, c.dorado500)).toBeGreaterThanOrEqual(AA.texto);
  });

  it("pero NO con blanco encima", () => {
    // El reflejo habitual seria poner texto blanco sobre el boton dorado.
    expect(contraste("#FFFFFF", c.dorado500)).toBeLessThan(AA.texto);
  });

  it("el marrón dorado NO sirve como texto sobre la franja durazno", () => {
    // 3.92: por eso los iconos de la franja van en tinta y no en acento.
    expect(contraste(c.dorado800, c.dorado300)).toBeLessThan(AA.texto);
  });

  it("y un botón marrón NO se distingue de un bloque azul", () => {
    // 1.94: por eso ningun boton secundario va sobre fondo azul (plan 03.1).
    expect(contraste(c.dorado800, c.azul900)).toBeLessThan(AA.interfaz);
  });
});

describe("el velo del hero", () => {
  it("la opacidad declarada en el CSS es la que da por buena esta prueba", () => {
    // Si alguien baja --velo-hero, el peor caso de arriba deja de ser cierto sin
    // que la prueba lo note: por eso se ata el valor aqui.
    expect(CSS).toMatch(/--velo-hero:\s*0\.85;/);
  });
});

describe("el fondo nunca es blanco puro", () => {
  it("el fondo de página y las secciones alternas se distinguen del blanco", () => {
    // Regla de marca (docs/marca.md §8): el blanco puro de FONDO rompe el tono
    // cálido. Las tarjetas sí son blancas desde 3.1 (prototipo de Stitch): se
    // separan del fondo precisamente porque este no lo es.
    expect(c.crema50.toLowerCase()).not.toBe("#ffffff");
    expect(c.crema100.toLowerCase()).not.toBe("#ffffff");
  });

  it("tarjeta, fondo y sección alterna se distinguen entre sí", () => {
    // Entre las capas tiene que haber diferencia visible, o las tarjetas no se
    // separan del fondo ni las secciones entre ellas.
    expect(contraste(c.crema0, c.crema50)).toBeGreaterThan(1.02);
    expect(contraste(c.crema50, c.crema100)).toBeGreaterThan(1.02);
  });
});
