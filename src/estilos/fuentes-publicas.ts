import localFont from "next/font/local";

/**
 * Las dos fuentes que solo usa el sitio público, encima de la Jakarta de
 * `fuentes.ts`. Las eligió Dan el 19/11/2026 sobre la portada real: Playfair
 * Display vuelve a los títulos y Dancing Script entra como acento caligráfico.
 * Comparación en `DOC/Maquetas/caligrafia/`.
 *
 * Las dos van **sin precarga**, y es lo que hace que el panel y el ingreso no las
 * descarguen: sin `<link rel=preload>`, el navegador solo baja una fuente cuando
 * algo de la página la usa, y fuera de `.sitio-publico` nada la usa. Con
 * precarga, Next la ponía en TODAS las rutas: `CascaraPublica` la usa también el
 * 404 de la raíz (`app/not-found.tsx`), que cuelga del layout raíz, y eso ata la
 * fuente a la raíz aunque viva en un módulo aparte. Lo comprueba una prueba de
 * `e2e/portada.spec.ts`: el ingreso baja un solo woff2, el de Jakarta.
 *
 * Viven en su propio módulo para que el panel no las importe ni por descuido.
 *
 * Locales y recortadas a latín por `scripts/preparar-fuentes.py`, como Jakarta.
 * Las dos declaran un nombre reservado en su licencia, así que los archivos se
 * llaman «Playfair Pimpos» y «Dancing Pimpos» por dentro (ver
 * `fuentes/LICENCIA.md`). Los export se llaman como la tipografía por el mismo
 * motivo que en `fuentes.ts`: `next/font` usa ese nombre como familia CSS.
 */

/**
 * Playfair Display, para los títulos del sitio público. Mientras llega se ve en
 * Times New Roman con las métricas ajustadas, así que el título no salta.
 */
export const playfair = localFont({
  src: "./fuentes/playfair-latin.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  preload: false,
  variable: "--fuente-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/**
 * Dancing Script, el acento caligráfico. Va fijada en seminegrita, el único
 * peso que se escribe: 26 KB frente a los 43 de la variable entera.
 *
 * Mientras llega se ve en Georgia, con las métricas ajustadas para que la línea
 * no salte al cambiar.
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

/** Clases que publican `--fuente-serif` y `--fuente-caligrafica` en la cáscara pública. */
export const clasesDeFuentesPublicas = `${playfair.variable} ${dancing.variable}`;
