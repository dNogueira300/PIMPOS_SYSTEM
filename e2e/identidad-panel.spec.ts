import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("la pestaña seleccionada conserva el contraste al pasar el puntero", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    const activa = page.getByRole("tab", { name: "Contacto", exact: true });
    await expect(activa).toHaveAttribute("aria-selected", "true");
    await activa.hover();
    const { violations } = await new AxeBuilder({ page }).include('[role="tablist"]').analyze();
    expect(violations).toEqual([]);
    await page.getByRole("tab", { name: "Horarios", exact: true }).click();
    const lunes = page.locator('[data-dia="lunes"]');
    await lunes.getByLabel("Turno 1: abre").fill("13:00");
    await lunes.getByLabel("cierra").first().fill("04:00");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    const conError = page.getByRole("tab", { name: /Horarios/ });
    await expect(conError).toHaveAttribute("data-con-error", "true");
    await conError.hover();
    const error = await new AxeBuilder({ page }).include('[role="tablist"]').analyze();
    expect(error.violations).toEqual([]);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el acceso muestra el logo completo y el formulario cabe en móvil", async ({ page }) => {
  await page.goto("/ingresar");
  const logo = page.getByRole("img", { name: "Panadería Pimpo's" });
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const caja = await logo.locator("..").boundingBox();
  expect(caja).not.toBeNull();
  expect(Math.abs(caja!.width - caja!.height)).toBeLessThan(1);
  await expect(page.getByLabel("Correo")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("la marca y la navegación del panel caben en tamaños intermedios", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const logo = page.locator('img[alt="Panadería Pimpo\'s"]:visible');
      await expect(logo).toHaveCount(1);
      await expect
        .poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator("main#contenido")).toBeVisible();
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});
