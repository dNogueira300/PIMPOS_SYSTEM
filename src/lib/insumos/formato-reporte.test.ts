import { describe, expect, it } from "vitest";

import { formatearCelda, formatearSoles, marcarSinCosto } from "./formato-reporte";

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
