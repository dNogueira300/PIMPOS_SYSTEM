import { describe, expect, it } from "vitest";

import { formatearCelda, formatearSoles } from "./formato-reporte";

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
