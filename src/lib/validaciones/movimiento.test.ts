import { describe, expect, it } from "vitest";

import { erroresPorCampo, esquemaConsumo, esquemaIngreso } from "./movimiento";

const HARINA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const SACO = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const FOX = "2c3f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const ingreso = {
  proveedor_id: FOX,
  documento_tipo: "boleta",
  documento_numero: "B001-123",
  ocurrido_en: "",
  observacion: "Todo en buen estado",
  confirmar_repetido: false,
  lineas: [
    {
      insumo_id: HARINA,
      cantidad: "2",
      unidad_id: SACO,
      precio_unitario: "S/ 150,00",
      fecha_vencimiento: "",
      codigo_lote: "",
    },
  ],
};

describe("esquemaIngreso", () => {
  it("normaliza cantidades y precios escritos a mano, sin volverlos números", () => {
    const r = esquemaIngreso.parse({
      ...ingreso,
      lineas: [{ ...ingreso.lineas[0]!, cantidad: " 1,5 " }],
    });
    expect(r.lineas[0]?.cantidad).toBe("1.5");
    expect(r.lineas[0]?.precio_unitario).toBe("150.00");
    expect(r.lineas[0]?.fecha_vencimiento).toBeNull();
    expect(r.lineas[0]?.codigo_lote).toBeNull();
  });

  it("vacío en la fecha es «ahora»; con fecha, pasa de Iquitos a UTC", () => {
    expect(esquemaIngreso.parse(ingreso).ocurrido_en).toBeNull();
    expect(esquemaIngreso.parse({ ...ingreso, ocurrido_en: "2026-10-12T08:00" }).ocurrido_en).toBe(
      "2026-10-12T13:00:00.000Z",
    );
  });

  it("una fecha que no lo es se rechaza", () => {
    expect(esquemaIngreso.safeParse({ ...ingreso, ocurrido_en: "ayer" }).success).toBe(false);
  });

  it("pide al menos una línea, el número de documento y el precio", () => {
    expect(esquemaIngreso.safeParse({ ...ingreso, lineas: [] }).success).toBe(false);
    expect(esquemaIngreso.safeParse({ ...ingreso, documento_numero: " " }).success).toBe(false);
    expect(
      esquemaIngreso.safeParse({
        ...ingreso,
        lineas: [{ ...ingreso.lineas[0]!, precio_unitario: "" }],
      }).success,
    ).toBe(false);
  });

  it("no deja el mismo insumo dos veces en la misma boleta", () => {
    const r = esquemaIngreso.safeParse({
      ...ingreso,
      lineas: [ingreso.lineas[0], ingreso.lineas[0]],
    });
    expect(r.success).toBe(false);
  });
});

describe("esquemaConsumo", () => {
  const consumo = {
    origen_consumo: "produccion",
    destino_lote: "Pan francés",
    area_turno: "Mañana",
    observacion: "Primera hornada",
    ocurrido_en: "",
    lineas: [{ insumo_id: HARINA, cantidad: "40", unidad_id: SACO }],
  };

  it("acepta el consumo del día", () => {
    expect(esquemaConsumo.safeParse(consumo).success).toBe(true);
  });

  it("pide para qué fue y en qué turno (ficha 7.6)", () => {
    expect(esquemaConsumo.safeParse({ ...consumo, destino_lote: "" }).success).toBe(false);
    expect(esquemaConsumo.safeParse({ ...consumo, area_turno: "" }).success).toBe(false);
  });
});

describe("erroresPorCampo", () => {
  it("dice en qué línea está el error", () => {
    const r = esquemaIngreso.safeParse({
      ...ingreso,
      lineas: [{ ...ingreso.lineas[0]!, cantidad: "cero" }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(erroresPorCampo(r.error))).toContain("lineas.0.cantidad");
    }
  });
});
