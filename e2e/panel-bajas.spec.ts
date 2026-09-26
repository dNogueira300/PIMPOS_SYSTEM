import { expect, test } from "@playwright/test";

import { sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en la sal de la semilla");
});

async function pedir(page: import("@playwright/test").Page, observacion: string) {
  await page.goto("/admin/insumos/bajas/nueva");
  await page.getByLabel("Insumo").selectOption({ label: "Sal" });
  await page.getByLabel("Cantidad").fill("2");
  await page.getByLabel("Motivo").selectOption({ label: "Merma o desperdicio" });
  await page.getByLabel("Qué pasó").fill(observacion);
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL("/admin/insumos/bajas");
}

test("el ingeniero pide, el administrador aprueba y el saldo baja", async ({ browser }) => {
  await sumarStock("Sal", 10);
  const paginaIngeniero = await (await browser.newContext()).newPage();
  const paginaAdmin = await (await browser.newContext()).newPage();
  const ingeniero = await entrarComo(paginaIngeniero, "ingeniero");
  const admin = await entrarComo(paginaAdmin, "administrador");
  const observacion = `Aprobar E2E ${Date.now()}`;
  try {
    await pedir(paginaIngeniero, observacion);
    await expect(paginaIngeniero.getByText("Pendiente").first()).toBeVisible();

    await paginaAdmin.goto("/admin");
    await paginaAdmin.locator('[data-aviso="bajas-pendientes"]').click();
    const tarjeta = paginaAdmin.getByRole("listitem").filter({ hasText: observacion });
    await tarjeta.getByRole("button", { name: /^Aprobar la baja de 2 kg de Sal/ }).click();
    await expect(tarjeta).toHaveCount(0);

    await paginaIngeniero.reload();
    await expect(
      paginaIngeniero.getByRole("list", { name: "Tus bajas" }).getByText("Aprobada").first(),
    ).toBeVisible();
  } finally {
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(admin.id);
  }
});

test("un rechazo llega con su comentario", async ({ browser }) => {
  const paginaIngeniero = await (await browser.newContext()).newPage();
  const paginaAdmin = await (await browser.newContext()).newPage();
  const ingeniero = await entrarComo(paginaIngeniero, "ingeniero");
  const admin = await entrarComo(paginaAdmin, "administrador");
  const observacion = `Rechazar E2E ${Date.now()}`;
  try {
    await pedir(paginaIngeniero, observacion);

    await paginaAdmin.goto("/admin/insumos/bajas");
    const tarjeta = paginaAdmin.getByRole("listitem").filter({ hasText: observacion });
    await tarjeta.getByRole("button", { name: /^Rechazar la baja/ }).click();
    await paginaAdmin.getByLabel("Comentario").fill("Cuéntalo primero");
    await paginaAdmin.getByRole("button", { name: "Rechazar", exact: true }).click();
    await expect(tarjeta).toHaveCount(0);

    await paginaIngeniero.goto("/admin");
    await expect(paginaIngeniero.locator('[data-aviso="bajas-rechazadas"]')).toBeVisible();
    await paginaIngeniero.goto("/admin/insumos/bajas");
    await expect(paginaIngeniero.getByText("Comentario: Cuéntalo primero").first()).toBeVisible();
  } finally {
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(admin.id);
  }
});
