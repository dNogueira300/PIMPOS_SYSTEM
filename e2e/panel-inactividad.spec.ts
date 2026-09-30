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
    await fijarActividad(context, HORA);
    await page.getByRole("textbox").first().pressSequentially("Pan");
    await expect
      .poll(async () => Date.now() - Number(await marcaDeActividad(context)))
      .toBeLessThan(5 * 60 * 1000);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("con la pestaña abierta y sin tocar nada dos horas, se cierra sola", async ({ page }) => {
  await page.clock.install();
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.clock.fastForward(2 * HORA + 2 * 60 * 1000);
    await expect(page).toHaveURL(/\/ingresar\?.*motivo=inactividad/, { timeout: 15_000 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/ingresar/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
