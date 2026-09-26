/**
 * La base guarda en UTC y el panel muestra la hora de Iquitos (convención de
 * CLAUDE.md). Perú no cambia la hora en verano, así que el desfase es fijo:
 * −05:00. Sin librería de zonas horarias.
 *
 * `<input type="datetime-local">` trabaja con «2026-10-01T08:00», sin zona.
 */
const DESFASE = "-05:00";
const CINCO_HORAS_MS = 5 * 60 * 60 * 1000;

export function limaAUtc(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const fecha = new Date(`${local}:00${DESFASE}`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export function utcALima(iso: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Date(fecha.getTime() - CINCO_HORAS_MS).toISOString().slice(0, 16);
}

/** «12/10/2026 08:00», en hora de Iquitos. Para mensajes y listas. */
export function formatearFechaLima(iso: string): string {
  const local = utcALima(iso);
  if (!local) return "";
  const [fecha, hora] = local.split("T");
  const [anio, mes, dia] = fecha!.split("-");
  return `${dia}/${mes}/${anio} ${hora}`;
}
