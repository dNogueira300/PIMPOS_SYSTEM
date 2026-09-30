/**
 * Cierre de sesión por inactividad (pedido de Dan, 29/09/2026): dos horas sin
 * usar el panel y hay que volver a entrar. Supabase solo lo ofrece en el plan
 * de pago, así que lo lleva la aplicación: una cookie con el momento de la
 * última actividad, que renuevan el proxy (en cada petición del panel) y el
 * navegador (al tocar, escribir o desplazarse), y que el proxy mira antes de
 * dejar pasar.
 *
 * Sin dependencias: la usan el proxy y un componente de cliente.
 */
export const INACTIVIDAD_MAXIMA_MS = 2 * 60 * 60 * 1000;

/** El nombre de la cookie. No es secreta: solo guarda una hora. */
export const COOKIE_ACTIVIDAD = "pimpos_actividad";

/** Cuánto puede ir adelantado el reloj del navegador sin que cuente como trampa. */
const TOLERANCIA_RELOJ_MS = 5 * 60 * 1000;

/**
 * Si pasaron más de dos horas desde la última actividad. Sin marca, no hay
 * nada que medir (acaba de entrar): empieza a contar. Una marca ilegible, o una
 * del futuro más allá de un desfase de reloj normal, cuenta como vencida: la
 * cookie la puede escribir el navegador, y así no sirve para alargar la sesión.
 */
export function sesionInactiva(marca: string | undefined, ahora: number): boolean {
  if (marca === undefined) return false;
  const ultima = /^\d+$/.test(marca) ? Number(marca) : Number.NaN;
  if (!Number.isFinite(ultima)) return true;
  if (ultima > ahora + TOLERANCIA_RELOJ_MS) return true;
  return ahora - ultima > INACTIVIDAD_MAXIMA_MS;
}
