import { defineConfig } from "vitest/config";

// Vitest cubre la logica de negocio pura: conversion de unidades, calculo de
// saldos, formato de moneda, enlaces wa.me, slugs (doc 03 §6). Las pruebas de
// componentes y de flujos completos van por Playwright, no por aqui.
//
// Extension .mts a proposito: el proyecto no declara "type": "module" y Vite
// carga la configuracion como CommonJS si es .ts.
export default defineConfig({
  resolve: {
    // Resuelve el alias "@/*" de tsconfig.json sin plugins.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    // Sin globales implicitos: cada prueba importa lo que usa.
    globals: false,
  },
});
