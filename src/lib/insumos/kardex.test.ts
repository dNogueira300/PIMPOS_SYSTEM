import { describe, expect, it } from "vitest";

import { detalleDeMovimiento } from "./kardex";

const vacio = {
  tipo: "ingreso",
  proveedor: null,
  documento: null,
  destino_lote: null,
  area_turno: null,
  motivo_baja: null,
  observacion: null,
};

describe("detalleDeMovimiento", () => {
  it("un ingreso dice de quién y con qué documento", () => {
    expect(
      detalleDeMovimiento({ ...vacio, proveedor: "Comercial FOX", documento: "boleta B001-123" }),
    ).toBe("Comercial FOX · boleta B001-123");
  });

  it("un consumo dice para qué y en qué turno", () => {
    expect(
      detalleDeMovimiento({
        ...vacio,
        tipo: "consumo",
        destino_lote: "Pan francés",
        area_turno: "Mañana",
      }),
    ).toBe("Pan francés · Mañana");
  });

  it("una baja dice el motivo en palabras", () => {
    expect(
      detalleDeMovimiento({ ...vacio, tipo: "baja", motivo_baja: "devolucion_proveedor" }),
    ).toBe("Devolución al proveedor");
  });

  it("un ajuste y una anulación dicen su explicación", () => {
    expect(
      detalleDeMovimiento({ ...vacio, tipo: "ajuste", observacion: "Inventario inicial" }),
    ).toBe("Inventario inicial");
    expect(detalleDeMovimiento({ ...vacio, tipo: "anulacion", observacion: "Se contó mal" })).toBe(
      "Anula un registro: Se contó mal",
    );
  });
});
