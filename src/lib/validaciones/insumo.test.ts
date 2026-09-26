import { describe, expect, it } from "vitest";

import { esquemaInsumo } from "./insumo";

const KG = "7a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const SACO = "8b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const G = "9c3f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const base = {
  id: null,
  nombre: "Harina",
  descripcion: null,
  unidad_base_id: KG,
  presentacion: "Saco de 50 kg",
  stock_minimo: "1500",
  es_perecible: false,
  proveedor_habitual_id: null,
  equivalencias: [{ unidad_desde_id: SACO, factor: "50" }],
};

describe("esquemaInsumo", () => {
  it("acepta un insumo completo", () => {
    expect(esquemaInsumo.safeParse(base).success).toBe(true);
  });

  it("normaliza el mínimo y el factor escritos con coma", () => {
    const r = esquemaInsumo.parse({
      ...base,
      stock_minimo: "25,5",
      equivalencias: [{ unidad_desde_id: G, factor: "0,001" }],
    });
    expect(r.stock_minimo).toBe("25.5");
    expect(r.equivalencias[0]?.factor).toBe("0.001");
  });

  it("no deja repetir una unidad", () => {
    const r = esquemaInsumo.safeParse({
      ...base,
      equivalencias: [
        { unidad_desde_id: SACO, factor: "50" },
        { unidad_desde_id: SACO, factor: "25" },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("no deja una equivalencia de la unidad base consigo misma", () => {
    const r = esquemaInsumo.safeParse({
      ...base,
      equivalencias: [{ unidad_desde_id: KG, factor: "1" }],
    });
    expect(r.success).toBe(false);
  });

  it("pide un nombre y una unidad base", () => {
    expect(esquemaInsumo.safeParse({ ...base, nombre: "" }).success).toBe(false);
    expect(esquemaInsumo.safeParse({ ...base, unidad_base_id: "" }).success).toBe(false);
  });
});
