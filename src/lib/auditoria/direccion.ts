/**
 * De los controles de `FiltrosHistorial` a la dirección. Vive aparte y sin
 * dependencias: lo importa un componente de cliente, y `filtros.ts` tira del
 * catálogo entero (AGENTS.md: antes de importar algo desde un `"use client"`,
 * seguir la cadena hasta el final).
 */

/** Lo que tienen puesto los controles de `FiltrosHistorial`. */
export type ValoresDeFiltros = {
  persona: string;
  seccion?: string;
  hizo?: string;
  cuando: string;
  desde: string;
  hasta: string;
};

/**
 * De lo elegido en los filtros, los parámetros de la dirección; `null` si
 * todavía no hay que navegar. Un rango a medias o al revés no navega: la
 * página caería a «los últimos 7 días», u ordenaría las dos fechas y los
 * campos cambiarían bajo los dedos de quien todavía está escribiendo la
 * segunda. Y no se manda lo que la pestaña no ofrece: una persona que no está
 * entre las opciones (una cuenta eliminada que venía en la dirección) se
 * quedaría pegada a cada filtro siguiente.
 */
export function aDireccion(
  v: ValoresDeFiltros,
  o: {
    personas: readonly string[];
    conSeccion: boolean;
    conHizo: boolean;
    conservar: Readonly<Record<string, string>>;
  },
): URLSearchParams | null {
  if (v.cuando === "rango" && !(v.desde && v.hasta && v.desde <= v.hasta)) return null;
  const parametros = new URLSearchParams(o.conservar);
  if (v.persona && o.personas.includes(v.persona)) parametros.set("persona", v.persona);
  if (o.conSeccion && v.seccion) parametros.set("seccion", v.seccion);
  if (o.conHizo && v.hizo) parametros.set("hizo", v.hizo);
  parametros.set("cuando", v.cuando);
  if (v.cuando === "rango") {
    parametros.set("desde", v.desde);
    parametros.set("hasta", v.hasta);
  }
  return parametros;
}
