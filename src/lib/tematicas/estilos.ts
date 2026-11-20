import { DISENOS, esSlugConDiseno, type OpcionEstilo } from "./disenos";

/**
 * Los estilos de las temáticas (plan 08, 0048; por temática desde el plan 08.1,
 * 0049; Halloween y la Canción Criolla desde el 08.2, 0050). Cada temática tiene los suyos, con su CSS en
 * `src/estilos/tematicas.css` (`[data-tematica="…"][data-estilo="…"]`), y la
 * base solo admite los de cada una (`tematicas_estilo_de_su_tematica`). Los
 * valores no se repiten entre temáticas. Sin dependencias: lo usan el panel y
 * el sitio.
 */
export const ESTILOS = [
  "noche",
  "crema",
  "rosa-crema",
  "rosa",
  "calabaza-noche",
  "calabaza-crema",
  "rojo-blanco",
  "balcon",
] as const;

export type Estilo = (typeof ESTILOS)[number];

/** Los estilos de una temática, en su orden. Vacío si no tiene diseño. */
export function opcionesDeEstilo(slug: string): readonly OpcionEstilo[] {
  return esSlugConDiseno(slug) ? DISENOS[slug].estilos : [];
}

export function esEstiloDe(slug: string, estilo: string): boolean {
  return opcionesDeEstilo(slug).some((o) => o.valor === estilo);
}

/**
 * Lo que llega de la base (texto, quizá NULL) como uno de los estilos de esa
 * temática: lo desconocido cae en el estilo puesto de la temática, nunca en el
 * de otra.
 */
export function comoEstilo(slug: string, valor: string | null | undefined): Estilo {
  const opciones = opcionesDeEstilo(slug);
  return opciones.find((o) => o.valor === valor)?.valor ?? opciones[0]?.valor ?? "noche";
}
