import localFont from "next/font/local";

/**
 * Dirección A: Jakarta variable local, sin peticiones a servicios de fuentes.
 * Es la letra de todo el sitio, y la única del panel y del ingreso. Los títulos
 * en Playfair y el acento caligráfico del sitio público están en
 * `fuentes-publicas.ts`, aparte para que solo se precarguen allí.
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

export const clasesDeFuentes = jakarta.variable;
