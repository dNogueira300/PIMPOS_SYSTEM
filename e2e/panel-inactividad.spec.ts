import { expect, test, type BrowserContext } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Dos horas sin usar el panel cierran la sesión (Dan, 29/09/2026). La marca de
 * actividad es la cookie `pimpos_actividad` (src/lib/auth/inactividad.ts).
 */
const HORA = 60 * 60 * 1000;

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "la sesión no depende del tamaño de pantalla");
});

async function marcaDeActividad(context: BrowserContext) {
  return (await context.cookies()).find((c) => c.name === "pimpos_actividad")?.value;
}

async function fijarActividad(context: BrowserContext, hace: number) {
  await context.addCookies([
    {
      name: "pimpos_actividad",
      value: String(Date.now() - hace),
      url: "http://localhost:3000",
    },
  ]);
}

test("entrar deja la marca de actividad", async ({ page, context }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    const marca = Number(await marcaDeActividad(context));
    expect(Date.now() - marca).toBeLessThan(5 * 60 * 1000);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("con más de dos horas sin actividad, la siguiente página pide entrar otra vez", async ({
  page,
  context,
}) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await fijarActividad(context, 2 * HORA + 60 * 1000);
    await page.goto("/admin/contenido");
    await expect(page).toHaveURL(/\/ingresar\?.*motivo=inactividad/);
    await expect(page.getByTestId("motivo-ingreso")).toContainText("dos horas");

    // Y la sesión está cerrada de verdad: el panel vuelve a pedir entrar.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/ingresar/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("con actividad reciente, sigue dentro y la marca se renueva", async ({ page, context }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await fijarActividad(context, HORA);
    await page.goto("/admin/contenido");
    await expect(page).toHaveURL(/\/admin\/contenido$/);
    expect(Date.now() - Number(await marcaDeActividad(context))).toBeLessThan(5 * 60 * 1000);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("escribir o tocar en la página cuenta como actividad", async ({ page, context }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    // Antes de hidratar no hay quien oiga las teclas; una persona no escribe
    // tan rápido, una prueba sí.
    await page.waitForLoadState("networkidle");
    await fijarActividad(context, HORA);
    await page.getByRole("textbox").first().pressSequentially("Pan");
    await expect
      .poll(async () => Date.now() - Number(await marcaDeActividad(context)))
      .toBeLessThan(5 * 60 * 1000);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("con la pestaña abierta y sin tocar nada dos horas, se cierra sola", async ({
  page,
  context,
}) => {
  await page.clock.install();
  const usuario = await entrarComo(page, "administrador");
  try {
    // La marca vence para el servidor Y para el navegador: es el camino de
    // producción (el navegador va a /ingresar y el proxy cierra la sesión).
    await fijarActividad(context, 2 * HORA + 60 * 1000);
    await page.clock.fastForward(2 * 60 * 1000);
    await expect(page).toHaveURL(/\/ingresar\?.*motivo=inactividad/, { timeout: 15_000 });
    await expect(page.getByLabel("Correo")).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/ingresar/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("con el reloj de la computadora una hora adelantado, se puede trabajar", async ({ page }) => {
  await page.clock.install({ time: Date.now() + HORA });
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido");
    await page.getByRole("heading", { level: 1 }).click();
    await page.clock.fastForward(2 * 60 * 1000);
    await page.goto("/admin/contenido/categorias");
    await page.getByRole("heading", { level: 1 }).click();
    await page.clock.fastForward(2 * 60 * 1000);
    await page.goto("/admin/insumos");
    await expect(page).toHaveURL(/\/admin\/insumos$/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("una sesión sin marca de actividad no se reanuda: pide entrar", async ({ page, context }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await context.clearCookies({ name: "pimpos_actividad" });
    await page.goto("/admin/contenido");
    await expect(page).toHaveURL(/\/ingresar/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("si se cerró la sesión en otra pestaña, esta deja de enseñar el panel", async ({
  page,
  context,
}) => {
  await page.clock.install();
  const usuario = await entrarComo(page, "administrador");
  try {
    // Salir borra la marca (en esta prueba, a mano: es la otra pestaña).
    await context.clearCookies({ name: "pimpos_actividad" });
    await page.clock.fastForward(2 * 60 * 1000);
    await expect(page).toHaveURL(/\/ingresar/, { timeout: 15_000 });
  } finally {
    await borrarUsuario(usuario.id);
  }
});
