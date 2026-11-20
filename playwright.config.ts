import { defineConfig, devices } from "@playwright/test";

import { CRON_SECRET_DE_PRUEBA } from "./e2e/ayudas/cron";
import { supabaseLocal } from "./e2e/ayudas/supabase-local";

const PUERTO = 3000;
const URL_BASE = `http://localhost:${PUERTO}`;
/** Las que encienden una temática: corren al final, en su propio proyecto. */
const PRUEBAS_DE_TEMATICAS = [
  /tematica-navidad\.spec\.ts/,
  /tematica-dia-de-la-madre\.spec\.ts/,
  /panel-tematicas\.spec\.ts/,
];

// Flujos criticos de punta a punta (doc 03 §6): ingreso por rol, publicar un
// producto, que un ingeniero NO pueda publicar una promocion, registrar un
// movimiento de insumo, crear un cliente con foto, exportar a Excel.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Anotaciones en GitHub y un informe descargable incluso si un reintento pasa.
  // El reporter github por sí solo no crea playwright-report/.
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/resumen.json" }],
      ]
    : "list",

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
    // Una temática de temporada viste el sitio ENTERO (plan 08): mientras se
    // prueba el sitio público no puede haber ninguna encendida, y las pruebas
    // que la encienden van al final, solas. Si no, las que miran colores o la
    // barra de aviso fallarían a ratos sin que nada estuviera roto.
    {
      name: "preparar",
      testMatch: /tematica-apagar\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "movil",
      testIgnore: PRUEBAS_DE_TEMATICAS,
      dependencies: ["preparar"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "escritorio",
      testIgnore: PRUEBAS_DE_TEMATICAS,
      dependencies: ["preparar"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tematicas",
      testMatch: PRUEBAS_DE_TEMATICAS,
      dependencies: ["movil", "escritorio"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
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
      const { apiUrl, anonKey, serviceRoleKey } = supabaseLocal();
      return {
        NEXT_PUBLIC_SUPABASE_URL: apiUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        // La del entorno LOCAL, fija y pública (demo del CLI). La usa el panel
        // de usuarios (T6) para dar de alta cuentas. Sin NEXT_PUBLIC_: solo la
        // lee el servidor.
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
        // El sitemap, la imagen para compartir y los datos estructurados llevan
        // URLs absolutas. Tienen que apuntar al servidor de las pruebas para
        // que la prueba pueda pedirlas de verdad.
        NEXT_PUBLIC_SITE_URL: URL_BASE,
        // El resumen diario (F5, tarea 8) exige este secreto; las pruebas lo mandan.
        CRON_SECRET: CRON_SECRET_DE_PRUEBA,
        // Vacías a propósito: una variable del proceso gana a `.env.local`, así
        // que las pruebas nunca mandan un correo de verdad aunque alguien tenga
        // su llave de Resend en local.
        RESEND_API_KEY: "",
        CORREO_ALERTAS: "",
      };
    })(),
  },
});
