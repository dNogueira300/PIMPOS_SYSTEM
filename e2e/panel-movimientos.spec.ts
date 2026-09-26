import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

// Escribe en la harina y el azúcar de la semilla: un solo proyecto, para que
// móvil y escritorio no se pisen el saldo (trampa de CLAUDE.md).
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en insumos compartidos");
});

async function saldoDe(page: import("@playwright/test").Page, nombre: string): Promise<string> {
  await page.goto(`/admin/insumos?buscar=${encodeURIComponent(nombre)}`);
  const tarjeta = page
    .getByRole("list", { name: "Existencias de insumos" })
    .getByRole("listitem")
    .filter({ hasText: nombre })
    .first();
  return (await tarjeta.innerText()).replace(/\s+/g, " ");
}

test("un ingreso de dos líneas sube el saldo y un consumo lo baja", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const boleta = `E2E-${Date.now()}`;
  try {
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "Comercial FOX" });
    // { exact: true }: sin él, "Número" también resuelve al interruptor «Es
    // otro documento aunque el número se repita» (modo estricto de
    // Playwright), porque getByLabel compara por subcadena.
    await page.getByLabel("Número", { exact: true }).fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("1");
    await page.getByLabel("Unidad 1").selectOption({ label: "Saco" });
    await page.getByLabel("Precio unitario 1 (S/)").fill("120,50");
    await page.getByRole("button", { name: "Añadir otro insumo" }).click();
    await page.getByLabel("Insumo 2").selectOption({ label: "Sal" });
    await page.getByLabel("Cantidad 2").fill("2");
    await page.getByLabel("Unidad 2").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Precio unitario 2 (S/)").fill("2");
    await page.getByLabel("Observación").fill("Todo en buen estado");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    const antes = await saldoDe(page, "Azúcar");
    expect(antes).toMatch(/\d+ kg/);

    await page.goto("/admin/insumos/consumo");
    await page.getByLabel("Para qué").fill("Pan dulce");
    await page.getByLabel("Área o turno").fill("Mañana");
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("5");
    await page.getByLabel("Unidad 1").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Observación").fill("Prueba E2E");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    const kilos = (texto: string) => Number(/([\d.]+) kg/.exec(texto)?.[1]);
    expect(kilos(await saldoDe(page, "Azúcar"))).toBe(kilos(antes) - 5);

    // El mismo documento otra vez: avisa y no registra.
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "Comercial FOX" });
    await page.getByLabel("Número", { exact: true }).fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await page.getByLabel("Cantidad 1").fill("1");
    await page.getByLabel("Precio unitario 1 (S/)").fill("120");
    await page.getByLabel("Observación").fill("Repetida");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(/ya se registró el/)).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un consumo que no alcanza dice cuánto hay", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/consumo");
    await page.getByLabel("Para qué").fill("Prueba");
    await page.getByLabel("Área o turno").fill("Tarde");
    await page.getByLabel("Insumo 1").selectOption({ label: "Ajonjolí" });
    await page.getByLabel("Cantidad 1").fill("99999");
    await page.getByLabel("Observación").fill("Prueba E2E");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(/Solo hay .* de Ajonjolí/)).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});
