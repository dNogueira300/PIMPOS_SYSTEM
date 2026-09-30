import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "una descarga basta");
});

test("la administración descarga el Excel de una zona, sin fotos, y queda registrado", async ({
  page,
}) => {
  const nombre = `Exportar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre, zona: "Punchana", celular: "912333444" });
  const usuario = await entrarComo(page, "administrador");
  const api = await sesionDeApi("administrador");
  try {
    const { data: zona } = await api
      .from("zonas_reparto")
      .select("id")
      .eq("nombre", "Punchana")
      .single();
    await page.goto(`/admin/clientes?zona=${zona!.id}`);
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(
      /^pimpos-clientes-punchana-\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.readFile(await descarga.path());
    const hoja = libro.worksheets[0]!;
    expect(hoja.getCell("A2").value).toMatch(/^Punchana · activos · al \d{2}\/\d{2}\/\d{4}$/);
    const filas: string[] = [];
    hoja.eachRow((fila, n) => {
      if (n >= 5) filas.push(fila.values!.toString());
    });
    expect(filas.find((f) => f.includes(nombre))).toContain("912 333 444");
    expect(filas.join("\n")).not.toMatch(/clientes\/|\.webp|\.jpg/);

    const { data: registro } = await api
      .from("exportaciones_clientes")
      .select("formato, exportado_por, filtro")
      .eq("exportado_por", usuario.id)
      .single();
    expect(registro).toMatchObject({
      formato: "xlsx",
      filtro: { zona: "Punchana", estado: "activos" },
    });
  } finally {
    await borrarClienteDePrueba(id);
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarUsuario(usuario.id);
  }
});

test("el PDF se descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/clientes");
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar PDF" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/^pimpos-clientes-todas-\d{4}-\d{2}-\d{2}\.pdf$/);
  } finally {
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve los botones ni llega a la descarga", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/clientes");
    await expect(page.getByRole("link", { name: "Descargar Excel" })).toHaveCount(0);
    await page.goto("/admin/clientes/excel");
    await page.waitForURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
