import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en el mejorador de la semilla");
});

test("el administrador cuenta, ve el ajuste en el kárdex y lo anula", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/conteo");
    await page.getByLabel("Por qué se cuenta").fill("Prueba E2E de conteo");
    await page.getByLabel("Contado de Mejorador (kg)").fill("137");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    await page.goto("/admin/insumos?buscar=Mejorador");
    await page.getByRole("list", { name: "Existencias de insumos" }).getByText("Mejorador").click();
    await expect(page.getByRole("heading", { name: "Mejorador" })).toBeVisible();
    await expect(page.getByText("137 kg").first()).toBeVisible();

    const lista = page.getByRole("list", { name: "Movimientos de Mejorador" });
    await lista
      .getByRole("button", { name: /^Anular el conteo del/ })
      .first()
      .click();
    await page.getByLabel("Motivo").fill("Prueba E2E");
    await page.getByRole("button", { name: "Anular", exact: true }).click();
    await expect(lista.getByText("(anulado)").first()).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve Conteo ni Anular", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos");
    await expect(page.getByRole("link", { name: "Conteo" })).toHaveCount(0);
    await page.goto("/admin/insumos/conteo");
    await page.waitForURL("/admin/insumos");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
