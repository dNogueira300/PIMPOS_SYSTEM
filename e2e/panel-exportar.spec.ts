import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";

import { sesionDeApi, sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "una descarga basta");
});

test("el Excel de existencias trae lo mismo que la pantalla", async ({ page }) => {
  await sumarStock("Sal", 1);
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    // Una foto del almacén dice de qué día es, en el nombre y dentro.
    expect(descarga.suggestedFilename()).toMatch(/^pimpos-existencias-\d{4}-\d{2}-\d{2}\.xlsx$/);

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(await descarga.path());
    const hoja = libro.worksheets[0]!;
    expect(hoja.getCell("A1").value).toBe("Existencias y valorización");
    expect(hoja.getCell("A2").value).toMatch(/^Al \d{2}\/\d{2}\/\d{4}$/);
    const insumos: unknown[] = [];
    hoja.eachRow((fila, n) => {
      if (n >= 5) insumos.push(fila.getCell(1).value);
    });
    expect(insumos).toContain("Sal");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el PDF se descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar PDF" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/^pimpos-existencias-\d{4}-\d{2}-\d{2}\.pdf$/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el kárdex se descarga con el insumo y el periodo de la pantalla", async ({ page }) => {
  await sumarStock("Sal", 1);
  const administracion = await sesionDeApi("administrador");
  const { data: sal } = await administracion
    .from("insumos")
    .select("id")
    .eq("nombre", "Sal")
    .single();
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(
      `/admin/insumos/reportes/kardex?insumo=${sal!.id}&desde=2026-01-01&hasta=2099-12-31`,
    );
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toBe("pimpos-kardex-2026-01-01-al-2099-12-31.xlsx");

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(await descarga.path());
    expect(libro.worksheets[0]!.getCell("A1").value).toBe("Kárdex de un insumo: Sal");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("si la sesión se cerró, el botón lleva a ingresar y no baja un archivo", async ({
  page,
  context,
}) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/insumos/reportes/existencias");
    const enlace = page.getByRole("link", { name: "Descargar Excel" });
    await expect(enlace).toBeVisible();
    await context.clearCookies();
    let descargas = 0;
    page.on("download", () => (descargas += 1));
    await enlace.click();
    await expect(page).toHaveURL(/\/ingresar/);
    expect(descargas).toBe(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("sin sesión, la descarga manda a ingresar", async ({ page }) => {
  const respuesta = await page.goto("/admin/insumos/reportes/existencias/excel");
  expect(page.url()).toContain("/ingresar");
  expect(respuesta?.headers()["content-type"] ?? "").not.toContain("spreadsheet");
});

test("el repartidor no descarga reportes de insumos", async ({ page }) => {
  const usuario = await entrarComo(page, "repartidor");
  try {
    const respuesta = await page.goto("/admin/insumos/reportes/existencias/pdf");
    expect(page.url()).not.toContain("/reportes/");
    expect(respuesta?.headers()["content-type"] ?? "").not.toContain("pdf");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
