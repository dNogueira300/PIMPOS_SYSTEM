import localFont from "next/font/local";

/**
 * Tipografía del sistema. Elegida por el propietario sobre una maqueta real de
 * la portada, no sobre una muestra de texto (doc 03 §3.2).
 *
 * Se sirven desde el propio proyecto con `next/font/local`, nunca desde Google:
 * así no se envía la IP de cada visitante a un tercero y se ahorra la conexión
 * extra a `fonts.gstatic.com`, que retrasa el primer render. Iquitos tiene
 * conectividad móvil variable y el móvil es prioritario (R6).
 *
 * Ambas son variables: un archivo cubre todo el rango 300–700 en lugar de uno
 * por peso. Ver `fuentes/LICENCIA.md`.
 *
 * Los dos export se llaman como la tipografía y no en español, saltándose la
 * convención del proyecto, por un motivo concreto: `next/font` usa el nombre de
 * la variable como nombre de la familia CSS. Con `fuenteTitulo`, las devtools
 * mostraban `font-family: fuenteTitulo`, que no dice qué letra es. Así se lee
 * `font-family: fraunces` y se entiende de un vistazo.
 */

/**
 * Fraunces, para los títulos.
 *
 * Su contraste entre trazo grueso y fino es lo que la hace leerse como hecha a
 * mano, que es el estilo tradicional/artesanal que declara la ficha (2.6) y lo
 * que acompaña a un logo con bebé chef y degradado arcoíris.
 *
 * Lleva además el eje óptico `opsz`: el navegador ajusta solo el contraste
 * según el tamaño con `font-optical-sizing: auto`, que es el comportamiento por
 * defecto. Por eso un titular grande se ve más marcado que un h3.
 */
export const fraunces = localFont({
  src: "./fuentes/fraunces-latin.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--fuente-titulo",
  fallback: ["Georgia", "Times New Roman", "serif"],
  // Ajusta las métricas de la fuente de reserva para que el texto no salte
  // cuando entra la definitiva.
  adjustFontFallback: "Times New Roman",
});

/** Inter, para el texto corrido: neutral y limpia, deja hablar al titular. */
export const inter = localFont({
  src: "./fuentes/inter-latin.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--fuente-texto",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
});

/** Clases que hay que poner en el `<html>` para publicar ambas variables CSS. */
export const clasesDeFuentes = `${fraunces.variable} ${inter.variable}`;
