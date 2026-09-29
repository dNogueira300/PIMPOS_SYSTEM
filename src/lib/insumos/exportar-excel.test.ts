import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { reporteAExcel } from "./exportar-excel";
import { AVISO_SIN_COSTO } from "./formato-reporte";
import type { Reporte } from "./reportes";

const reporte: Reporte = {
  slug: "consumo",
  titulo: "Consumo por periodo",
  subtitulo: "Del 01/10/2026 al 07/10/2026",
  columnas: [
    { clave: "insumo", titulo: "Insumo", tipo: "texto" },
    { clave: "cantidad", titulo: "Se usó", tipo: "cantidad" },
    { clave: "costo", titulo: "Costo", tipo: "soles" },
  ],
  filas: [
    { insumo: "Harina", cantidad: 120, costo: 364 },
    { insumo: "Manteca", cantidad: 2.5, costo: 22.5 },
  ],
  total: 386.5,
  sinCosto: [false, false],
  hayCostosDesconocidos: false,
  grafico: null,
  unidadGrafico: null,
};

async function abrir(r: Reporte) {
  const libro = new ExcelJS.Workbook();
  // exceljs declara su propio `interface Buffer` global y sus tipos no aceptan
  // el `Buffer` de Node, aunque en ejecución es exactamente lo que lee.
  const archivo = (await reporteAExcel(r)) as unknown as Parameters<typeof libro.xlsx.load>[0];
  await libro.xlsx.load(archivo);
  return libro.worksheets[0]!;
}

describe("reporteAExcel", () => {
  it("pone título, periodo, cabecera, filas y total, con números de verdad", async () => {
    const hoja = await abrir(reporte);

    expect(hoja.name).toBe("Consumo por periodo");
    expect(hoja.getCell("A1").value).toBe("Consumo por periodo");
    expect(hoja.getCell("A2").value).toBe("Del 01/10/2026 al 07/10/2026");
    expect(hoja.getRow(4).values).toEqual([undefined, "Insumo", "Se usó", "Costo"]);
    expect(hoja.getCell("A5").value).toBe("Harina");
    expect(hoja.getCell("C5").value).toBe(364);
    expect(hoja.getCell("C5").numFmt).toBe('"S/" #,##0.00');
    expect(hoja.getCell("B6").value).toBe(2.5);
    expect(hoja.getCell("B7").value).toBe("Total");
    expect(hoja.getCell("C7").value).toBe(386.5);
    // Sin costos desconocidos, no hay nota debajo del total.
    expect(hoja.getCell("A8").value).toBeNull();
  });

  it("marca el costo parcial sin dejar de ser un número, y pone la misma nota que la pantalla", async () => {
    const hoja = await abrir({
      ...reporte,
      filas: [
        { insumo: "Harina", cantidad: 120, costo: 364 },
        { insumo: "Sal", cantidad: 5, costo: 0 },
      ],
      total: 364,
      sinCosto: [false, true],
      hayCostosDesconocidos: true,
    });

    // La celda sigue sumando en la hoja: la marca va en el formato, no en el valor.
    expect(hoja.getCell("C6").value).toBe(0);
    expect(hoja.getCell("C6").numFmt).toBe('"S/" #,##0.00" *"');
    expect(hoja.getCell("C5").numFmt).toBe('"S/" #,##0.00');
    // La cantidad nunca se marca: lo que no se sabe es el costo.
    expect(hoja.getCell("B6").numFmt ?? "").not.toContain("*");
    expect(hoja.getCell("A8").value).toBe(AVISO_SIN_COSTO);
  });

  it("un título con signos que Excel no admite sigue dando una hoja", async () => {
    const hoja = await abrir({
      ...reporte,
      slug: "kardex",
      titulo: "Kárdex de un insumo: Harina especial panadera",
      total: null,
    });
    expect(hoja.name).not.toContain(":");
    expect(hoja.name.length).toBeLessThanOrEqual(31);
    expect(hoja.getCell("A1").value).toBe("Kárdex de un insumo: Harina especial panadera");
  });

  it("un nombre de insumo con apóstrofo en el borde de la hoja no rompe la descarga", async () => {
    // 31 caracteres justos terminando en «'»: Excel no admite ese nombre de hoja.
    const titulo = "Kárdex de un insumo: Pan d'agu'";
    const hoja = await abrir({ ...reporte, slug: "kardex", titulo, total: null });
    expect(hoja.name.startsWith("'") || hoja.name.endsWith("'")).toBe(false);
    expect(hoja.getCell("A1").value).toBe(titulo);
  });
});
