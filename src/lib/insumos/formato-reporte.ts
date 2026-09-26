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
