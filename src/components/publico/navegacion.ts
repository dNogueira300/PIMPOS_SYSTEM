/**
 * Las secciones del sitio publico (doc 03 §4.1), en un solo sitio.
 *
 * La cabecera y el pie leen de aqui: si se anade una seccion, aparece en los
 * dos sin que nadie tenga que acordarse del segundo.
 *
 * `/guias` no esta a proposito: la ficha (5.1) la marco como no incluida,
 * aunque las guias si se administran (6.4). Se publican dentro de
 * `/preguntas-frecuentes`.
 */
export const SECCIONES = [
  { ruta: "/productos", nombre: "Productos" },
  { ruta: "/novedades", nombre: "Novedades" },
  { ruta: "/nosotros", nombre: "Nosotros" },
  { ruta: "/galeria", nombre: "Galería" },
  { ruta: "/ubicacion", nombre: "Ubicación" },
  { ruta: "/preguntas-frecuentes", nombre: "Preguntas" },
  { ruta: "/contacto", nombre: "Contacto" },
] as const;

export type Seccion = (typeof SECCIONES)[number];

/**
 * Si la ruta actual pertenece a una seccion, contando sus subpaginas:
 * `/productos/frances-chico` marca "Productos".
 */
export function esSeccionActiva(rutaActual: string, ruta: string): boolean {
  return rutaActual === ruta || rutaActual.startsWith(`${ruta}/`);
}
