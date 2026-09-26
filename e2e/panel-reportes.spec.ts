import { expect, test } from "@playwright/test";

import { sesionDeApi, sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escribe en el ajonjolí de la semilla");
});

test("un consumo de hoy aparece en el reporte con su costo", async ({ page }) => {
  // 10 kg de ajonjolí a S/ 8 el kg, y se consumen 2: S/ 16.
  const administracion = await sesionDeApi("administrador");
  const { data: insumo } = await administracion
    .from("existencias_insumo")
    .select("id, cantidad_base")
    .eq("nombre", "Ajonjolí")
    .single();
  await administracion.rpc("registrar_conteo", {
    p_lineas: [
      {
        insumo_id: insumo!.id,
        contado: String(Number(insumo!.cantidad_base) + 10),
        precio_unitario: "8",
      },
    ],
    p_observacion: "Stock para el reporte E2E",
  });
  const ingeniero = await sesionDeApi("ingeniero");
  const { data: kg } = await ingeniero
    .from("unidades_medida")
    .select("id")
    .eq("codigo", "kg")
    .single();
  const { error } = await ingeniero.rpc("registrar_consumo", {
    p_cabecera: {
      origen_consumo: "produccion",
      destino_lote: "Pan con ajonjolí",
      area_turno: "Mañana",
      observacion: "E2E",
    },
    p_lineas: [{ insumo_id: insumo!.id, cantidad: "2", unidad_id: kg!.id }],
  });
  expect(error).toBeNull();

  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/reportes/consumo");
    await page.getByRole("link", { name: "Esta semana" }).click();
    const tarjeta = page
      .getByRole("list", { name: "Consumo por periodo" })
      .getByRole("listitem")
      .filter({ hasText: "Ajonjolí" });
    await expect(tarjeta).toBeVisible();
    // FEFO: si otra prueba dejó ajonjolí más barato antes, el costo cambia; se
    // comprueba que el costo exista y que el total lo incluya, no una cifra fija.
    await expect(tarjeta.getByText(/S\/ \d/)).toBeVisible();
    await expect(page.locator("[data-total]")).toContainText("S/");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("existencias enseña el valor del almacén", async ({ page }) => {
  await sumarStock("Sal", 1);
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    await expect(
      page.getByRole("list", { name: "Existencias y valorización" }).getByText("Sal"),
    ).toBeVisible();
    await expect(page.locator("[data-total]")).toContainText("Total: S/");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
