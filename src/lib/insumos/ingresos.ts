import { formatearFechaLima } from "@/lib/panel/hora-lima";

import type { Periodo } from "./periodo";

/**
 * Lo que el historial de ingresos (`/admin/insumos/ingresos`) y la columna
 * «Último ingreso» de existencias escriben. Lógica pura, con Vitest.
 */

/** Tope del historial en una página: con más, se pide acotar las fechas. */
export const MAXIMO_INGRESOS = 300;

const NOMBRE_DOCUMENTO: Record<string, string> = {
  boleta: "Boleta",
  factura: "Factura",
  guia: "Guía",
};

/** «Boleta B001-123». Un tipo que no se conoce se dice tal cual. */
export function describirDocumento(tipo: string | null, numero: string | null): string {
  const nombre = tipo ? (NOMBRE_DOCUMENTO[tipo] ?? tipo) : "";
  const n = numero?.trim() ?? "";
  if (!nombre && !n) return "Sin documento";
  return [nombre, n].filter(Boolean).join(" ");
}

/** «10/10/2026», el día de Iquitos de una fecha guardada en UTC. */
export function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  return formatearFechaLima(iso).split(" ")[0] ?? "";
}

const dia = (fecha: string) => fecha.split("-").reverse().join("/");

/** «2 ingresos del 07/10/2026 al 10/10/2026 (y 1 anulado).» */
export function resumenIngresos(validos: number, anulados: number, periodo: Periodo): string {
  const cuantos = validos === 1 ? "1 ingreso" : `${validos} ingresos`;
  const extra = anulados > 0 ? ` (y ${anulados} ${anulados === 1 ? "anulado" : "anulados"})` : "";
  return `${cuantos} del ${dia(periodo.desde)} al ${dia(periodo.hasta)}${extra}.`;
}
