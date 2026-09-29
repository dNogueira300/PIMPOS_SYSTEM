import type { Periodo } from "./periodo";

/**
 * `pimpos-consumo-2026-10-01-al-2026-10-07.xlsx`, o `pimpos-existencias-2026-09-29.pdf`
 * para una foto de un día (un reporte sin periodo). El slug y las fechas ya son ASCII.
 */
export function nombreDeArchivo(
  slug: string,
  cuando: Periodo | string,
  extension: "xlsx" | "pdf",
): string {
  const fecha = typeof cuando === "string" ? cuando : `${cuando.desde}-al-${cuando.hasta}`;
  return `pimpos-${slug}-${fecha}.${extension}`;
}
