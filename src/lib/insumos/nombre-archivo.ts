import type { Periodo } from "./periodo";

/** `pimpos-consumo-2026-10-01-al-2026-10-07.xlsx`: el slug y las fechas ya son ASCII. */
export function nombreDeArchivo(
  slug: string,
  periodo: Periodo | null,
  extension: "xlsx" | "pdf",
): string {
  const rango = periodo ? `-${periodo.desde}-al-${periodo.hasta}` : "";
  return `pimpos-${slug}${rango}.${extension}`;
}
