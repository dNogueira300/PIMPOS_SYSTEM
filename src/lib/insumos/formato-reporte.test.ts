import { describe, expect, it } from "vitest";

import {
  formatearCelda,
  formatearSoles,
  marcarSinCosto,
  textosDeLasFilas,
} from "./formato-reporte";
import type { Reporte } from "./reportes";

describe("formatearSoles", () => {
  it("con separador de miles y dos decimales, como en una boleta", () => {
    expect(formatearSoles(1234.5)).toBe("S/ 1,234.50");
    expect(formatearSoles(0.1)).toBe("S/ 0.10");
  });
});

describe("formatearCelda", () => {
  it("según el tipo de columna", () => {
    expect(formatearCelda(12.5, "cantidad")).toBe("12.5");
    expect(formatearCelda(364, "soles")).toBe("S/ 364.00");
    expect(formatearCelda("Harina", "texto")).toBe("Harina");
    expect(formatearCelda(null, "soles")).toBe("—");
  });
});

describe("marcarSinCosto", () => {
  it("añade el aviso solo a una celda en soles marcada", () => {
    expect(marcarSinCosto("S/ 16.00", "soles", true)).toBe("S/ 16.00 *");
  });

  it("no toca una celda en soles sin marcar", () => {
    expect(marcarSinCosto("S/ 16.00", "soles", false)).toBe("S/ 16.00");
  });

  it("no marca una columna que no es de dinero, aunque la fila esté marcada", () => {
    expect(marcarSinCosto("7", "cantidad", true)).toBe("7");
    expect(marcarSinCosto("Harina", "texto", true)).toBe("Harina");
  });
});

describe("textosDeLasFilas", () => {
  const reporte: Reporte = {
    slug: "mermas",
    titulo: "Mermas y pérdidas",
    subtitulo: "Del 01/10/2026 al 07/10/2026",
    columnas: [
      { clave: "motivo", titulo: "Motivo", tipo: "texto" },
      { clave: "cantidad", titulo: "Cantidad", tipo: "cantidad" },
      { clave: "costo", titulo: "Costo", tipo: "soles" },
    ],
    filas: [
      { motivo: "Merma o desperdicio", cantidad: 2, costo: 16 },
      { motivo: "Faltante en conteo", cantidad: 1.5, costo: null },
    ],
    total: 16,
    sinCosto: [false, true],
    hayCostosDesconocidos: true,
    grafico: null,
    unidadGrafico: null,
  };

  it("cada celda con el mismo texto que la pantalla, y la marca solo donde el costo es parcial", () => {
    expect(textosDeLasFilas(reporte)).toEqual([
      ["Merma o desperdicio", "2", "S/ 16.00"],
      ["Faltante en conteo", "1.5", "— *"],
    ]);
  });
});
