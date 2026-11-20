import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Las fechas de los ingresos (pedido de Dan, 19/11/2026): un insumo que no
 * vence no pide fecha de vencimiento, la lista de existencias dice cuándo
 * entró por última vez y el historial de ingresos lo enseña y lo filtra.
 */

// Escribe en una bolsa de la semilla: un solo proyecto, para que móvil y
// escritorio no se pisen (trampa de AGENTS.md).
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en insumos compartidos");
});

/** «19/11/2026», el día de Iquitos de hoy. */
function hoyEnIquitos(): string {
  const local = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return local.split("-").reverse().join("/");
}

test("una compra de bolsas no pide vencimiento y queda en el historial", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const boleta = `E2E-BOLSAS-${Date.now()}`;
  const bolsa = "Bolsa panadera 18x26";
  try {
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "La Casa Plast" });
    await page.getByLabel("Número", { exact: true }).fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: bolsa });
    await page.getByLabel("Cantidad 1").fill("2");
    await page.getByLabel("Unidad 1").selectOption({ label: "Paquete" });
    await page.getByLabel("Precio unitario 1 (S/)").fill("3,50");
    // Las bolsas no son perecibles: no hay fecha de vencimiento que llenar.
    await expect(page.getByLabel("Vence 1")).toHaveCount(0);
    await page.getByLabel("Observación").fill("Prueba E2E del historial de ingresos");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    // La lista principal dice cuándo entró por última vez.
    await page.goto(`/admin/insumos?buscar=${encodeURIComponent(bolsa)}`);
    const tarjeta = page
      .getByRole("list", { name: "Existencias de insumos" })
      .getByRole("listitem")
      .filter({ hasText: bolsa })
      .first();
    await expect(tarjeta).toContainText(`Último ingreso: ${hoyEnIquitos()}`);

    // El historial, filtrado por el insumo, trae la boleta.
    await page.goto("/admin/insumos");
    await page.getByRole("link", { name: "Historial de ingresos" }).click();
    await page.waitForURL("/admin/insumos/ingresos");
    // getByRole y exacto: la lista de existencias sigue montada tras navegar
    // (trampa del App Router en AGENTS.md) y getByLabel busca por subcadena.
    await page
      .getByRole("combobox", { name: "Insumo", exact: true })
      .selectOption({ label: bolsa });
    await page.getByRole("button", { name: "Filtrar" }).click();
    await page.waitForURL(/insumo=/);
    const historial = page.getByRole("list", { name: "Historial de ingresos" });
    const fila = historial.getByRole("listitem").filter({ hasText: boleta });
    await expect(fila).toContainText(hoyEnIquitos());
    await expect(fila).toContainText("La Casa Plast");
    await expect(fila).toContainText("No vence");

    // Con otro proveedor, la boleta no sale.
    await page
      .getByRole("combobox", { name: "Proveedor", exact: true })
      .selectOption({ label: "Comercial FOX" });
    await page.getByRole("button", { name: "Filtrar" }).click();
    await page.waitForURL(/proveedor=/);
    await expect(page.getByText(boleta)).toHaveCount(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
