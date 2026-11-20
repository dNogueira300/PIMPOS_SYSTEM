import { describe, expect, it } from "vitest";

import { describirDocumento, fechaCorta, resumenIngresos } from "./ingresos";

describe("describirDocumento", () => {
  it("dice el tipo con su número", () => {
    expect(describirDocumento("boleta", "B001-123")).toBe("Boleta B001-123");
    expect(describirDocumento("factura", "F001-9")).toBe("Factura F001-9");
    expect(describirDocumento("guia", "G-7")).toBe("Guía G-7");
  });

  it("sin número, solo el tipo; sin nada, «Sin documento»", () => {
    expect(describirDocumento("boleta", null)).toBe("Boleta");
    expect(describirDocumento("boleta", "  ")).toBe("Boleta");
    expect(describirDocumento(null, null)).toBe("Sin documento");
  });

  it("un tipo desconocido se dice tal cual, no se pierde", () => {
    expect(describirDocumento("recibo", "R-1")).toBe("recibo R-1");
  });
});

describe("fechaCorta", () => {
  it("el día de Iquitos, no el de UTC", () => {
    // 04:30 UTC del 11/10 son las 11:30 p. m. del 10/10 en Iquitos.
    expect(fechaCorta("2026-10-11T04:30:00.000Z")).toBe("10/10/2026");
  });

  it("sin fecha, vacío", () => {
    expect(fechaCorta(null)).toBe("");
  });
});

describe("resumenIngresos", () => {
  it("cuenta en singular y plural, con el periodo en días", () => {
    expect(resumenIngresos(1, 0, { desde: "2026-10-07", hasta: "2026-10-10" })).toBe(
      "1 ingreso del 07/10/2026 al 10/10/2026.",
    );
    expect(resumenIngresos(2, 0, { desde: "2026-10-07", hasta: "2026-10-10" })).toBe(
      "2 ingresos del 07/10/2026 al 10/10/2026.",
    );
  });

  it("los anulados se nombran aparte", () => {
    expect(resumenIngresos(2, 1, { desde: "2026-10-07", hasta: "2026-10-10" })).toBe(
      "2 ingresos del 07/10/2026 al 10/10/2026 (y 1 anulado).",
    );
    expect(resumenIngresos(0, 3, { desde: "2026-10-07", hasta: "2026-10-07" })).toBe(
      "0 ingresos del 07/10/2026 al 07/10/2026 (y 3 anulados).",
    );
  });
});
