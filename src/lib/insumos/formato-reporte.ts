import { formatearCantidad } from "./unidades";

export type TipoColumna = "texto" | "cantidad" | "soles";

/** Solo para enseñar: el total ya viene sumado por la base con `numeric`. */
export function formatearSoles(n: number): string {
  const [enteros, decimales] = n.toFixed(2).split(".");
  const conMiles = enteros!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `S/ ${conMiles}.${decimales}`;
}

export function formatearCelda(valor: string | number | null, tipo: TipoColumna): string {
  if (valor === null || valor === "") return "—";
  if (tipo === "soles") return formatearSoles(Number(valor));
  if (tipo === "cantidad") return formatearCantidad(Number(valor));
  return String(valor);
}

/**
 * El texto de una celda en soles, con el aviso de que parte de la cantidad no
 * tiene costo registrado (revisión de tarea 6, hallazgo I-2). Solo marca la
 * columna de dinero: una fila «sin costo» sigue teniendo cantidad exacta, lo
 * que no se sabe es cuánto costó una parte de ella.
 *
 * Pura y exportada para que la pantalla y, en la tarea 7, el Excel y el PDF
 * escriban exactamente el mismo texto — la misma regla que ya sigue
 * `leerReporte` con el resto del reporte.
 */
export function marcarSinCosto(celda: string, tipo: TipoColumna, sinCosto: boolean): string {
  return tipo === "soles" && sinCosto ? `${celda} *` : celda;
}
