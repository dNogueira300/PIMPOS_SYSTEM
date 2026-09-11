import { defineConfig, devices } from "@playwright/test";

import { supabaseLocal } from "./e2e/ayudas/supabase-local";

const PUERTO = 3000;
const URL_BASE = `http://localhost:${PUERTO}`;

// Flujos criticos de punta a punta (doc 03 §6): ingreso por rol, publicar un
// producto, que un ingeniero NO pueda publicar una promocion, registrar un
// movimiento de insumo, crear un cliente con foto, exportar a Excel.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  // Margen amplio a proposito: el ingreso pasa por Supabase local en Docker, y
  // los 5 s que espera Playwright por defecto se quedan cortos en un arranque
  // frio. Es preferible a meter esperas fijas, que serian mas lentas y mas
  // fragiles.
  expect: { timeout: 20_000 },

  use: {
    baseURL: URL_BASE,
    trace: "on-first-retry",
    // El negocio y sus usuarios estan en Iquitos.
    locale: "es-PE",
    timezoneId: "America/Lima",
  },

  // Un solo navegador (Chromium) en dos tamanos. El movil es prioritario (R6)
  // y la definicion de "hecho" exige que todo funcione a 375 px de ancho.
  projects: [
    {
      name: "movil",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Se prueba contra el BUILD, no contra `next dev`.
  //
  // `next dev` compila cada ruta la primera vez que se pide. Con quince rutas y
  // cuatro procesos en paralelo, varias pruebas se quedaban esperando a que
  // compilara una pagina y fallaban por tiempo agotado, sin que hubiera nada
  // roto. Contra el build no hay compilacion: cada peticion mide lo que de
  // verdad va a medir el visitante, incluido el prerenderizado.
  webServer: {
    command: "pnpm build && pnpm start",
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    // El build entero cabe en este margen; en CI arranca desde cero.
    timeout: 300_000,
    // Estas sobreescriben lo que hubiera en .env.local: las pruebas siempre
    // corren contra el Supabase local, nunca contra el proyecto alojado.
    env: (() => {
      const { apiUrl, anonKey } = supabaseLocal();
      return {
        NEXT_PUBLIC_SUPABASE_URL: apiUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        // El sitemap, la imagen para compartir y los datos estructurados llevan
        // URLs absolutas. Tienen que apuntar al servidor de las pruebas para
        // que la prueba pueda pedirlas de verdad.
        NEXT_PUBLIC_SITE_URL: URL_BASE,
      };
    })(),
  },
});
