import { describe, expect, it } from "vitest";

import { esquemaConteo } from "./conteo";

const HARINA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("esquemaConteo", () => {
  it("solo cuenta los insumos con algo escrito", () => {
    const r = esquemaConteo.parse({
      observacion: "Inventario inicial",
      lineas: [{ insumo_id: HARINA, contado: "62,5", precio_unitario: "", fecha_vencimiento: "" }],
    });
    expect(r.lineas[0]).toEqual({
      insumo_id: HARINA,
      contado: "62.5",
      precio_unitario: null,
      fecha_vencimiento: null,
    });
  });

  it("pide al menos un insumo contado y una explicación", () => {
    expect(esquemaConteo.safeParse({ observacion: "x", lineas: [] }).success).toBe(false);
    expect(
      esquemaConteo.safeParse({
        observacion: "",
        lineas: [{ insumo_id: HARINA, contado: "1", precio_unitario: "", fecha_vencimiento: "" }],
      }).success,
    ).toBe(false);
  });
});
