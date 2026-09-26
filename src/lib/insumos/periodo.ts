/**
 * Periodos en días de Iquitos. La base filtra con
 * `(ocurrido_en at time zone 'America/Lima')::date`, así que aquí basta con
 * hablar en fechas «2026-10-12», sin hora.
 */
export type Periodo = { desde: string; hasta: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;

export function hoyEnLima(ahora: Date): string {
  return new Date(ahora.getTime() - CINCO_HORAS_MS).toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const fechaValida = (v: unknown): v is string =>
  typeof v === "string" && FECHA.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime());

/** Desde `searchParams`. Sin fechas válidas, los últimos `diasPorDefecto` días hasta hoy. */
export function leerPeriodo(
  params: { desde?: unknown; hasta?: unknown },
  ahora: Date,
  diasPorDefecto: number,
): Periodo {
  const hoy = hoyEnLima(ahora);
  const hasta = fechaValida(params.hasta) ? params.hasta : hoy;
  const desde = fechaValida(params.desde) ? params.desde : sumarDias(hasta, -(diasPorDefecto - 1));
  return desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde };
}
