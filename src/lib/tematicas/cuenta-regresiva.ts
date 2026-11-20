/**
 * «Faltan 12 días para Navidad» (plan 08, T4). Las dos fechas son días de
 * Iquitos sin hora («2026-12-25»): quien llama pasa `hoyEnLima(...)`, así que
 * la medianoche UTC no adelanta el día. Pasada la fiesta, `null`: la sección no
 * dice nada en vez de contar hacia atrás. Sin dependencias.
 */
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

function enDias(fecha: string): number | null {
  if (!FECHA.test(fecha)) return null;
  const ms = Date.parse(`${fecha}T00:00:00.000Z`);
  return Number.isFinite(ms) ? Math.round(ms / UN_DIA_MS) : null;
}

export function textoCuentaRegresiva(
  fechaEvento: string,
  hoy: string,
  evento: string,
): string | null {
  const dia = enDias(fechaEvento);
  const hoyEnDias = enDias(hoy);
  if (dia === null || hoyEnDias === null) return null;

  const faltan = dia - hoyEnDias;
  if (faltan < 0) return null;
  if (faltan === 0) return `¡Hoy es ${evento}!`;
  if (faltan === 1) return `Falta 1 día para ${evento}`;
  return `Faltan ${faltan} días para ${evento}`;
}
