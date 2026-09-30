/**
 * Cierre de sesión por inactividad (pedido de Dan, 29/09/2026): dos horas sin
 * usar el panel y hay que volver a entrar. Supabase solo lo ofrece en el plan
 * de pago, así que lo lleva la aplicación: una cookie con el momento de la
 * última actividad, en hora del servidor, que renuevan el proxy (al cargar
 * una página entera del panel) y el navegador (al tocar, escribir o
 * desplazarse), y que el proxy mira en cada petición antes de dejar pasar.
 *
 * Sin dependencias: la usan el proxy y un componente de cliente.
 */
export const INACTIVIDAD_MAXIMA_MS = 2 * 60 * 60 * 1000;

/** El nombre de la cookie. No es secreta: solo guarda una hora. */
export const COOKIE_ACTIVIDAD = "pimpos_actividad";

/**
 * Lo mismo que las cookies de sesión de `@supabase/ssr` (400 días): si la marca
 * caducara antes que la sesión, quedaría una sesión sin marca.
 */
export const DURACION_MARCA_S = 400 * 24 * 60 * 60;

/** Cuánto puede ir adelantado el reloj del navegador sin que cuente como trampa. */
const TOLERANCIA_RELOJ_MS = 5 * 60 * 1000;

/**
 * Si pasaron más de dos horas desde la última actividad, en hora del servidor
 * (el navegador corrige su reloj antes de preguntar: `VigiaInactividad`).
 *
 * Falla cerrado: sin marca, o con una ilegible, o con una del futuro más allá
 * de un desfase normal, la sesión se da por vencida. Entrar escribe la marca
 * (`iniciarSesion`), así que una sesión sin ella es una de antes o una a la que
 * le borraron la cookie, y no debe reanudarse sin contraseña.
 */
export function sesionInactiva(marca: string | undefined, ahora: number): boolean {
  if (marca === undefined) return true;
  const ultima = /^\d+$/.test(marca) ? Number(marca) : Number.NaN;
  if (!Number.isFinite(ultima)) return true;
  if (ultima > ahora + TOLERANCIA_RELOJ_MS) return true;
  return ahora - ultima > INACTIVIDAD_MAXIMA_MS;
}
