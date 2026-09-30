import { describe, expect, it } from "vitest";

import { esquemaBaja } from "./baja";

const AZUCAR = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const KG = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("esquemaBaja", () => {
  const baja = {
    motivo_baja: "merma",
    observacion: "Se mojó un saco",
    lineas: [{ insumo_id: AZUCAR, cantidad: "5", unidad_id: KG }],
  };

  it("acepta una baja con motivo y explicación", () => {
    expect(esquemaBaja.safeParse(baja).success).toBe(true);
  });

  it("solo los cinco motivos de la ficha 7.7", () => {
    expect(esquemaBaja.safeParse({ ...baja, motivo_baja: "robo" }).success).toBe(false);
  });

  it("una sola línea y con explicación", () => {
    expect(
      esquemaBaja.safeParse({ ...baja, lineas: [...baja.lineas, ...baja.lineas] }).success,
    ).toBe(false);
    expect(esquemaBaja.safeParse({ ...baja, observacion: "" }).success).toBe(false);
  });

  it("puede nombrar su lote (decisión 3); sin lote, sale del que vence primero", () => {
    const LOTE = "2c2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
    const conLote = esquemaBaja.safeParse({
      ...baja,
      lineas: [{ ...baja.lineas[0], lote_id: LOTE }],
    });
    expect(conLote.success && conLote.data.lineas[0]!.lote_id).toBe(LOTE);
    const sinElegir = esquemaBaja.safeParse({
      ...baja,
      lineas: [{ ...baja.lineas[0], lote_id: "" }],
    });
    expect(sinElegir.success && sinElegir.data.lineas[0]!.lote_id).toBeNull();
    const sinCampo = esquemaBaja.safeParse(baja);
    expect(sinCampo.success && sinCampo.data.lineas[0]!.lote_id).toBeNull();
    expect(
      esquemaBaja.safeParse({ ...baja, lineas: [{ ...baja.lineas[0], lote_id: "otro" }] }).success,
    ).toBe(false);
  });
});
