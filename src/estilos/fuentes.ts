import localFont from "next/font/local";

/** Dirección A: Jakarta variable local, sin peticiones a servicios de fuentes. */
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
