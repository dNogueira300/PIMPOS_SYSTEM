import localFont from "next/font/local";

/**
 * Tipografía del sistema: Playfair Display para los títulos y Plus Jakarta
 * Sans para el texto. Las eligió Dan el 13/09/2026 sobre el prototipo de Stitch
 * que marca la dirección visual de la fase 3.1, en sustitución de Fraunces +
 * Inter (plan 03.1, tarea 1).
 *
 * Se sirven desde el propio proyecto con `next/font/local`, nunca desde Google:
 * así no se envía la IP de cada visitante a un tercero y se ahorra la conexión
 * extra a `fonts.gstatic.com`, que retrasa el primer render. Iquitos tiene
 * conectividad móvil variable y el móvil es prioritario (R6).
 *
 * Las dos son variables y están recortadas a latín: un archivo por familia
 * cubre todos los pesos, y juntas pesan 79 KB — menos que las 113 de las
 * anteriores. Las prepara `scripts/preparar-fuentes.py`; ver
 * `fuentes/LICENCIA.md`, que explica por qué el archivo de Playfair se llama
 * «Playfair Pimpos» por dentro.
 *
 * Los dos export se llaman como la tipografía y no en español, saltándose la
 * convención del proyecto, por un motivo concreto: `next/font` usa el nombre de
 * la variable como nombre de la familia CSS. Con `fuenteTitulo`, las devtools
 * mostrarían `font-family: fuenteTitulo`, que no dice qué letra es. Así se lee
 * `font-family: playfair` y se entiende de un vistazo.
 */

/**
 * Playfair Display, para los títulos.
 *
 * Un serif de alto contraste entre trazo grueso y fino: le da a los titulares
 * el aire de rótulo de panadería de siempre que pide el estilo tradicional de
 * la ficha (2.6), sin volverse rústico.
 */
export const playfair = localFont({
  src: "./fuentes/playfair-latin.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  variable: "--fuente-titulo",
  fallback: ["Georgia", "Times New Roman", "serif"],
  // Ajusta las métricas de la fuente de reserva para que el texto no salte
  // cuando entra la definitiva.
  adjustFontFallback: "Times New Roman",
});

/**
 * Plus Jakarta Sans, para el texto corrido y los precios: geométrica pero con
 * contraformas abiertas, muy legible en cifras pequeñas en un teléfono.
 */
export const jakarta = localFont({
  src: "./fuentes/jakarta-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--fuente-texto",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
});

/** Clases que hay que poner en el `<html>` para publicar ambas variables CSS. */
export const clasesDeFuentes = `${playfair.variable} ${jakarta.variable}`;
