import { describe, expect, it, vi } from "vitest";

import { reporteAPdf } from "./exportar-pdf";
import type { Reporte } from "./reportes";

// `server-only` lanza fuera de un Server Component; aquí solo estorba.
vi.mock("server-only", () => ({}));

const reporte: Reporte = {
  slug: "mermas",
  titulo: "Mermas y pérdidas",
  subtitulo: "Del 01/10/2026 al 07/10/2026",
  columnas: [
    { clave: "motivo", titulo: "Motivo", tipo: "texto" },
    { clave: "costo", titulo: "Costo", tipo: "soles" },
  ],
  filas: [
    { motivo: "Merma o desperdicio", costo: 16 },
    { motivo: "Faltante en conteo — año, ñ", costo: 0 },
  ],
  total: 16,
  sinCosto: [false, true],
  hayCostosDesconocidos: true,
  grafico: null,
  unidadGrafico: null,
};

/**
 * Leer el texto de un PDF exigiría otra dependencia: los textos de cada celda
 * se prueban en `textosDeLasFilas` (formato-reporte), que es lo que pinta el
 * PDF. Aquí se asegura que se genera y que las fuentes cargan — si una ruta de
 * fuente está mal, `renderToBuffer` lanza.
 */
describe("reporteAPdf", () => {
  it("devuelve un PDF", async () => {
    const pdf = await reporteAPdf(reporte);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("un reporte sin filas también da un PDF", async () => {
    const pdf = await reporteAPdf({ ...reporte, filas: [], sinCosto: [], total: null });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
