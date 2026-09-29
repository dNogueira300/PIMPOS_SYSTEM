import ExcelJS from "exceljs";

import { AVISO_SIN_COSTO, MARCA_SIN_COSTO } from "./formato-reporte";
import type { Reporte } from "./reportes";

const SOLES = '"S/" #,##0.00';
// «General» y no «0.####»: con ese formato Excel escribe «120.» cuando la
// cantidad es entera.
const FORMATO = { soles: SOLES, cantidad: "General" } as const;
// La marca de costo parcial va en el formato y no en el valor: la celda sigue
// siendo un número que se puede sumar, y se ve igual que en la pantalla.
const SOLES_SIN_COSTO = `${SOLES}"${MARCA_SIN_COSTO}"`;

/**
 * Un reporte a `.xlsx`. Los números van como números (el propietario los suma
 * en su hoja, como hacía antes), con formato de soles o de cantidad. Filas:
 * 1 título · 2 periodo · 3 vacía · 4 cabecera · 5… datos · después, el total
 * y, si alguna fila lleva costo parcial, la misma nota que la pantalla.
 */
export async function reporteAExcel(reporte: Reporte): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Panadería Pimpo's";
  // Excel no admite más de 31 caracteres ni algunos signos en el nombre de hoja.
  const hoja = libro.addWorksheet(reporte.titulo.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));

  hoja.getCell("A1").value = reporte.titulo;
  hoja.getCell("A1").font = { bold: true, size: 14 };
  hoja.getCell("A2").value = reporte.subtitulo;

  const cabecera = hoja.getRow(4);
  reporte.columnas.forEach((c, i) => {
    cabecera.getCell(i + 1).value = c.titulo;
    cabecera.getCell(i + 1).font = { bold: true };
  });

  reporte.filas.forEach((f, i) => {
    const fila = hoja.getRow(5 + i);
    reporte.columnas.forEach((c, j) => {
      const celda = fila.getCell(j + 1);
      const valor = f[c.clave] ?? null;
      celda.value = c.tipo === "texto" || valor === null ? valor : Number(valor);
      if (c.tipo === "texto") return;
      celda.numFmt =
        c.tipo === "soles" && (reporte.sinCosto[i] ?? false) ? SOLES_SIN_COSTO : FORMATO[c.tipo];
    });
  });

  let siguiente = 5 + reporte.filas.length;
  if (reporte.total !== null) {
    const ultima = hoja.getRow(siguiente);
    const columnaSoles = reporte.columnas.findIndex((c) => c.tipo === "soles");
    if (columnaSoles > 0) {
      ultima.getCell(columnaSoles).value = "Total";
      ultima.getCell(columnaSoles).font = { bold: true };
      ultima.getCell(columnaSoles + 1).value = reporte.total;
      ultima.getCell(columnaSoles + 1).numFmt = FORMATO.soles;
      ultima.getCell(columnaSoles + 1).font = { bold: true };
      siguiente += 1;
    }
  }
  if (reporte.hayCostosDesconocidos) {
    hoja.getCell(`A${siguiente}`).value = AVISO_SIN_COSTO;
  }

  reporte.columnas.forEach((c, i) => {
    hoja.getColumn(i + 1).width = c.tipo === "texto" ? 28 : 14;
  });

  return Buffer.from(await libro.xlsx.writeBuffer());
}
