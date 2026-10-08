import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("la vista previa de marca tiene agrupación accesible", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByRole("tab", { name: "Marca", exact: true }).click();
    await expect(page.locator('[aria-label="Así se verá el icono de la pestaña"]')).toBeVisible();
    const resultado = await new AxeBuilder({ page }).analyze();
    expect(resultado.violations).toEqual([]);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el aviso de copia local permite leer y descartar con contraste", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre", { exact: true }).fill("Copia de evidencia");
    await expect
      .poll(() => page.evaluate(() => Object.keys(localStorage).length))
      .toBeGreaterThan(0);
    await page.reload();
    await expect(page.locator("[data-borrador]")).toBeVisible();
    const resultado = await new AxeBuilder({ page }).include("[data-borrador]").analyze();
    expect(resultado.violations).toEqual([]);
    await page.getByRole("button", { name: "Descartar", exact: true }).hover();
    const alPasar = await new AxeBuilder({ page }).include("[data-borrador]").analyze();
    expect(alPasar.violations).toEqual([]);
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(page.locator("[data-borrador]")).toHaveCount(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el aviso de validación del formulario es legible", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(
      page.getByText("Revisa los campos marcados en rojo.", { exact: true }),
    ).toBeVisible();
    const resultado = await new AxeBuilder({ page }).include("[data-sonner-toaster]").analyze();
    expect(resultado.violations).toEqual([]);
    await expect(page.getByText("Escribe el nombre del producto.", { exact: true })).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});
