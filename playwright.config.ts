import { defineConfig, devices } from "@playwright/test";

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

  webServer: {
    command: "pnpm dev",
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
