import localFont from "next/font/local";

/**
 * Tipografía del sitio, local y sin peticiones a servicios de fuentes.
 *
 * - Plus Jakarta Sans: el texto de todo el sitio, y la única letra del panel y
 *   del ingreso (dirección A).
 * - Playfair Display: los títulos del sitio público.
 * - Dancing Script: el acento caligráfico del sitio público, en tres sitios.
 *
 * Playfair y Dancing las eligió Dan el 19/11/2026 sobre la portada real
 * (`DOC/Maquetas/caligrafia/`). Las tres variables CSS se publican en el
 * `<html>`, pero solo el sitio público las usa: los tokens que las consumen se
 * redefinen en la envoltura de `CascaraPublica` (`.sitio-publico`, en
 * globals.css). En el panel, `--font-heading` sigue siendo Jakarta.
 *
 * Las dos van **sin precarga**, y es lo que hace que el panel y el ingreso no
 * las descarguen: sin `<link rel=preload>`, el navegador solo baja una fuente
 * cuando algo de la página la usa, y fuera de `.sitio-publico` nada la usa. Con
 * precarga, Next la pone en todas las rutas. Lo comprueba una prueba de
 * `e2e/portada.spec.ts`: el ingreso baja un solo woff2, el de Jakarta.
 *
 * Este módulo lo importa SOLO el layout raíz, y es a propósito: si lo importa
 * también la cáscara pública (o las fuentes viven en un módulo que solo importa
 * ella), Turbopack saca sus `@font-face` en una hoja de estilos propia, una
 * petición más que bloquea el primer pintado. Medido con Lighthouse, costaba en
 * todas las páginas públicas. Por eso las clases van todas en el `<html>`.
 *
 * Las prepara `scripts/preparar-fuentes.py`, recortadas a latín. Playfair y
 * Dancing declaran un nombre reservado en su licencia, así que sus archivos se
 * llaman «Playfair Pimpos» y «Dancing Pimpos» por dentro (ver
 * `fuentes/LICENCIA.md`). Los export se llaman como la tipografía porque
 * `next/font` usa ese nombre como familia CSS: en las devtools se lee
 * `font-family: playfair` y se entiende de un vistazo.
 */

/** Plus Jakarta Sans, variable: texto, precios y cifras; títulos del panel. */
export const jakarta = localFont({
  src: "./fuentes/jakarta-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--fuente-texto",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: "Arial",
});

/**
 * Playfair Display, solo en negrita (700), como los títulos de la maqueta que
 * eligió Dan: 19 KB frente a los 49 de la variable entera. Un título en
 * seminegrita toma esta misma, la más cercana por encima. Mientras llega se ve
 * en Times New Roman con las métricas ajustadas, así que el título no salta.
 */
export const playfair = localFont({
  src: "./fuentes/playfair-latin.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  preload: false,
  variable: "--fuente-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/**
 * Dancing Script, solo en seminegrita (600), el único peso que se escribe:
 * 24 KB frente a los 43 de la variable entera. Mientras llega se ve en Georgia,
 * con las métricas ajustadas para que la línea no salte al cambiar.
 */
export const dancing = localFont({
  src: "./fuentes/dancing-latin.woff2",
  weight: "600",
  style: "normal",
  display: "swap",
  preload: false,
  variable: "--fuente-caligrafica",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/**
 * Clases que hay que poner en el `<html>`: publican `--fuente-texto`,
 * `--fuente-serif` y `--fuente-caligrafica`. Publicar una variable no descarga
 * nada; la fuente baja cuando un texto la usa.
 */
export const clasesDeFuentes = `${jakarta.variable} ${playfair.variable} ${dancing.variable}`;
