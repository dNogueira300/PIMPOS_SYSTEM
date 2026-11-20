import { DISENOS, esSlugConDiseno } from "./disenos";

/**
 * El nombre de la fiesta dentro de una frase (plan 08.1): «Faltan 3 días para
 * el Día de la Madre», «Mensajes del Día de la Madre», «Solo se vende en el
 * Día de la Madre». Navidad no lleva artículo. El artículo vive en el catálogo
 * (`disenos.ts`), así que el negocio no tiene que saberlo. Una temática sin
 * diseño usa su nombre tal cual. Sin dependencias.
 */
export function nombreEnFrase(slug: string, nombre: string): string {
  const articulo = esSlugConDiseno(slug) ? DISENOS[slug].articulo : "";
  return articulo ? `${articulo} ${nombre}` : nombre;
}

/** Lo mismo, detrás de «de»: «del Día de la Madre», «de Navidad». */
export function nombreConDe(slug: string, nombre: string): string {
  const articulo = esSlugConDiseno(slug) ? DISENOS[slug].articulo : "";
  return articulo === "el" ? `del ${nombre}` : `de ${nombreEnFrase(slug, nombre)}`;
}

/**
 * La línea de ayuda de la pestaña «Cuándo» para dos fiestas de la misma fecha
 * (plan 08.2): solo una puede estar encendida, y la apagada sigue apagada
 * aunque le cambien las fechas mientras no termine su campaña (0050). Al año
 * siguiente esa «Apagada» ya venció: hay que volver a elegirla.
 */
export function avisoDeAlternativa(
  slug: string,
  nombre: string,
  slugOtra: string,
  nombreOtra: string,
): string {
  const esta = nombreEnFrase(slug, nombre);
  const empieza = esta.charAt(0).toLocaleUpperCase("es") + esta.slice(1);
  return (
    `${empieza} y ${nombreEnFrase(slugOtra, nombreOtra)} son para la misma fiesta: solo una ` +
    "puede estar encendida. La otra déjala «Apagada»: seguirá apagada aunque le cambies las fechas, " +
    "hasta el día que termina. Cada año, al poner las fechas nuevas, vuelve a elegir «Apagada»."
  );
}
