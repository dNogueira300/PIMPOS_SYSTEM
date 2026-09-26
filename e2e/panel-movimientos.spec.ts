import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
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

test("cambiar de un insumo perecible a uno que no vence no deja fecha en el lote", async ({
  page,
}) => {
  // Revisión de la tarea 3 (I-1): la línea traía la fecha de la Manteca y el
  // insumo cambió a Azúcar, que no vence. Sin la limpieza al cambiar de
  // insumo, esa fecha viajaría igual y crearía un lote con vencimiento
  // fantasma para un insumo que nunca vence.
  const usuario = await entrarComo(page, "ingeniero");
  const boleta = `E2E-VENCE-${Date.now()}`;
  try {
    await page.goto("/admin/insumos/ingreso");
    await page.getByLabel("Proveedor").selectOption({ label: "Comercial FOX" });
    await page.getByLabel("Número", { exact: true }).fill(boleta);
    await page.getByLabel("Insumo 1").selectOption({ label: "Manteca" });
    await page.getByLabel("Cantidad 1").fill("1");
    await page.getByLabel("Unidad 1").selectOption({ label: "Caja" });
    await page.getByLabel("Precio unitario 1 (S/)").fill("90");
    await page.getByLabel("Vence 1").fill("2027-01-01");

    // Cambia a un insumo que no vence: el campo «Vence» desaparece.
    await page.getByLabel("Insumo 1").selectOption({ label: "Azúcar" });
    await expect(page.getByLabel("Vence 1")).toHaveCount(0);
    await page.getByLabel("Unidad 1").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Observación").fill("Prueba E2E de vencimiento fantasma");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/insumos");

    // El lote que de verdad se creó no lleva la fecha de la Manteca.
    const { apiUrl, anonKey } = supabaseLocal();
    const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
    const { error: errorSesion } = await cliente.auth.signInWithPassword({
      email: usuario.correo,
      password: usuario.clave,
    });
    expect(errorSesion).toBeNull();

    const { data, error } = await cliente
      .from("movimiento_lotes")
      .select("lotes_insumo(fecha_vencimiento), movimientos_insumo!inner(documento_numero)")
      .eq("movimientos_insumo.documento_numero", boleta);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const lote = Array.isArray(data![0]!.lotes_insumo)
      ? data![0]!.lotes_insumo[0]
      : data![0]!.lotes_insumo;
    expect(lote!.fecha_vencimiento).toBeNull();
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
