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
