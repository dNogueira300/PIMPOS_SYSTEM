import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AA, aCanales, contraste } from "@/lib/utilidades/contraste";

/**
 * Los contrastes de los dos estilos de Navidad (plan 08, T4), leídos de
 * `tematicas.css` y `globals.css` de verdad, como `paleta.test.ts`. Si alguien
 * ajusta un color de la temática y rompe un par, esto falla en el commit.
 */

const TEMATICAS = readFileSync(join(process.cwd(), "src/estilos/tematicas.css"), "utf8");
const GLOBALES = readFileSync(join(process.cwd(), "src/estilos/globals.css"), "utf8");

/** Los tokens hex del bloque de un estilo (el primero que lo nombra). */
function tokensDe(estilo: string, tematica = "navidad"): Record<string, string> {
  const inicio = TEMATICAS.indexOf(`[data-tematica="${tematica}"][data-estilo="${estilo}"] {`);
  if (inicio < 0) throw new Error(`No está el bloque del estilo ${estilo} de ${tematica}`);
  const bloque = TEMATICAS.slice(inicio, TEMATICAS.indexOf("}", inicio));
  const tokens: Record<string, string> = {};
  for (const [, nombre, valor] of bloque.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[nombre] = valor;
  }
  return tokens;
}

function primitivo(nombre: string): string {
  const r = new RegExp(`--pimpos-${nombre}:\\s*(#[0-9a-fA-F]{6});`).exec(GLOBALES);
  if (!r) throw new Error(`No está el primitivo ${nombre}`);
  return r[1];
}

/** `frente` con opacidad `alfa` sobre `fondo`. */
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

type Par = [string, string, number, string];

const n = tokensDe("noche");
const PARES_NOCHE: Par[] = [
  [n.foreground, n.background, AA.texto, "texto sobre el fondo pino"],
  [n.foreground, n.card, AA.texto, "texto sobre las tarjetas"],
  [n["muted-foreground"], n.background, AA.texto, "texto secundario sobre el fondo"],
  [n["muted-foreground"], n.card, AA.texto, "texto secundario sobre las tarjetas"],
  [n["muted-foreground"], n.muted, AA.texto, "texto secundario sobre el pie"],
  [n.primary, n.background, AA.texto, "titulares crema sobre el pino"],
  [n.primary, n.card, AA.texto, "titulares sobre las tarjetas"],
  [n["primary-foreground"], n.primary, AA.texto, "texto del bloque crema (hero, delivery)"],
  [n["cta-texto"], n["cta-fondo"], AA.texto, "botón rojo"],
  [n["cta-texto"], n["cta-fondo-hover"], AA.texto, "botón rojo al pasar"],
  [n["whatsapp-texto"], n["whatsapp-fondo"], AA.texto, "botón de WhatsApp"],
  [n["whatsapp-texto"], n["whatsapp-fondo-hover"], AA.texto, "WhatsApp al pasar"],
  [n["precio-texto"], n.card, AA.texto, "precio dorado sobre la tarjeta"],
  [n["precio-texto"], n.background, AA.texto, "precio de la pizarra sobre el fondo"],
  [n["acento-texto"], n.background, AA.texto, "acentos dorados"],
  [n["franja-texto"], n["franja-fondo"], AA.texto, "franja y cinta rojas"],
  [n["aviso-texto"], n["aviso-fondo"], AA.texto, "barra de arriba"],
  [n["sello-texto"], mezclar(n["sello-texto"], n.background, 0.14), AA.texto, "cuenta regresiva"],
  [n.ring, n.background, AA.interfaz, "anillo de foco"],
];

const crema50 = primitivo("crema-50");
const crema0 = primitivo("crema-0");
const crema100 = primitivo("crema-100");
const c = tokensDe("crema");
const PARES_CREMA: Par[] = [
  [c.primary, crema50, AA.texto, "titulares rojos sobre el crema"],
  [c.primary, crema0, AA.texto, "titulares rojos sobre las tarjetas"],
  [crema0, c.primary, AA.texto, "texto del bloque rojo (hero, delivery)"],
  [c["cta-texto"], c["cta-fondo"], AA.texto, "botón rojo"],
  [c["cta-texto"], c["cta-fondo-hover"], AA.texto, "botón rojo al pasar"],
  [c["acento-texto"], crema50, AA.texto, "acentos pino"],
  [c["acento-texto"], crema0, AA.texto, "acentos pino sobre tarjetas"],
  [c["franja-texto"], c["franja-fondo"], AA.texto, "franja y cinta pino"],
  [c["aviso-texto"], c["aviso-fondo"], AA.texto, "barra de arriba"],
  [c["sello-texto"], crema100, AA.texto, "cuenta regresiva"],
];

describe("Navidad · noche", () => {
  it.each(PARES_NOCHE)("%s sobre %s cumple (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

describe("Navidad · crema", () => {
  it.each(PARES_CREMA)("%s sobre %s cumple (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

// --- Día de la Madre (plan 08.1) ------------------------------------------
const rc = tokensDe("rosa-crema", "dia-de-la-madre");
const PARES_ROSA_CREMA: Par[] = [
  [rc.primary, crema50, AA.texto, "titulares vino sobre el crema"],
  [rc.primary, crema0, AA.texto, "titulares vino sobre las tarjetas"],
  [rc["primary-foreground"], rc.primary, AA.texto, "texto del bloque vino (hero, delivery)"],
  [rc["cta-texto"], rc["cta-fondo"], AA.texto, "botón vino"],
  [rc["cta-texto"], rc["cta-fondo-hover"], AA.texto, "botón vino al pasar"],
  [rc["acento-texto"], crema50, AA.texto, "acentos rosa (caligrafía, sellos)"],
  [rc["acento-texto"], crema0, AA.texto, "acentos rosa sobre tarjetas"],
  [rc["franja-texto"], rc["franja-fondo"], AA.texto, "franja y cinta rosa palo"],
  [rc["aviso-texto"], rc["aviso-fondo"], AA.texto, "barra de arriba"],
  [rc["sello-texto"], rc["sello-fondo"], AA.texto, "cuenta regresiva"],
  [rc.ring, crema50, AA.interfaz, "anillo de foco"],
];

const r = tokensDe("rosa", "dia-de-la-madre");
const PARES_ROSA: Par[] = [
  [r.foreground, r.background, AA.texto, "texto sobre el fondo rosa"],
  [r.foreground, r.card, AA.texto, "texto sobre las tarjetas"],
  [r["muted-foreground"], r.background, AA.texto, "texto secundario sobre el fondo"],
  [r["muted-foreground"], r.card, AA.texto, "texto secundario sobre las tarjetas"],
  [r["muted-foreground"], r.muted, AA.texto, "texto secundario sobre el pie"],
  [r.primary, r.background, AA.texto, "titulares vino sobre el rosa"],
  [r.primary, r.card, AA.texto, "titulares vino sobre las tarjetas"],
  [r["primary-foreground"], r.primary, AA.texto, "texto del bloque vino (hero, delivery)"],
  [r["cta-texto"], r["cta-fondo"], AA.texto, "botón frambuesa"],
  [r["cta-texto"], r["cta-fondo-hover"], AA.texto, "botón frambuesa al pasar"],
  [r["acento-texto"], r.background, AA.texto, "acentos frambuesa"],
  [r["acento-texto"], r.card, AA.texto, "acentos sobre tarjetas"],
  [r["precio-texto"], r.background, AA.texto, "precio dorado sobre el rosa"],
  [r["precio-texto"], r.card, AA.texto, "precio dorado sobre las tarjetas"],
  [r["franja-texto"], r["franja-fondo"], AA.texto, "franja y cinta vino"],
  [r["aviso-texto"], r["aviso-fondo"], AA.texto, "barra de arriba"],
  [r["sello-texto"], r["sello-fondo"], AA.texto, "cuenta regresiva"],
  [r.ring, r.background, AA.interfaz, "anillo de foco"],
];

describe("Día de la Madre · rosa sobre crema", () => {
  it.each(PARES_ROSA_CREMA)("%s sobre %s cumple (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});

describe("Día de la Madre · todo en rosa", () => {
  it.each(PARES_ROSA)("%s sobre %s cumple (%d): %s", (frente, fondo, umbral) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(umbral);
  });
});
