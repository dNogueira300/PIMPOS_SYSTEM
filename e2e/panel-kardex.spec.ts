import { expect, test } from "@playwright/test";

import { sesionDeApi, sumarLote } from "./ayudas/insumos";
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

test("en el conteo, cada precio dice de qué insumo es", async ({ page }) => {
  // Con lector de pantalla se oían 22 «Precio por kg (S/), si sobra» iguales.
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/conteo");
    await expect(page.getByLabel("Precio por kg de Sal (S/), si sobra")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("la ficha enseña primero el lote que sale primero (el que vence antes)", async ({ page }) => {
  const marca = Date.now();
  // El que vence después se crea antes: el orden no puede venir de la creación.
  await sumarLote("Frutas confitadas", 1, 60, `E2E-TARDE-${marca}`);
  await sumarLote("Frutas confitadas", 1, 5, `E2E-PRONTO-${marca}`);
  const { data: insumo } = await (
    await sesionDeApi("administrador")
  )
    .from("insumos")
    .select("id")
    .eq("nombre", "Frutas confitadas")
    .single();
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto(`/admin/insumos/${insumo!.id}`);
    const region = page.getByRole("region", { name: "Lotes con existencia" });
    // La ficha llega en streaming: esperar a los dos lotes antes de leer el orden.
    await expect(region.getByText(`E2E-PRONTO-${marca}`)).toBeVisible();
    await expect(region.getByText(`E2E-TARDE-${marca}`)).toBeVisible();
    const textos = await region.getByRole("listitem").allTextContents();
    const pronto = textos.findIndex((t) => t.includes(`E2E-PRONTO-${marca}`));
    const tarde = textos.findIndex((t) => t.includes(`E2E-TARDE-${marca}`));
    expect(pronto).toBeGreaterThanOrEqual(0);
    expect(pronto, "el que vence antes va arriba").toBeLessThan(tarde);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el kárdex sin insumo pide elegirlo", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/reportes/kardex");
    await expect(page.getByText("Elige un insumo para ver su kárdex.")).toBeVisible();
    await expect(page.getByText("No hay datos en ese periodo.")).toHaveCount(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
