import { describe, expect, it } from "vitest";

import { esquemaZona } from "./zona";

describe("esquemaZona", () => {
  it("pide un nombre", () => {
    expect(esquemaZona.safeParse({ id: null, nombre: " ", descripcion: null }).success).toBe(false);
  });
  it("limpia los espacios del nombre", () => {
    const r = esquemaZona.safeParse({ id: null, nombre: "  Carretera  ", descripcion: null });
    expect(r.success && r.data.nombre).toBe("Carretera");
  });
  it("la descripción es opcional y corta", () => {
    expect(
      esquemaZona.safeParse({ id: null, nombre: "Centro", descripcion: "x".repeat(201) }).success,
    ).toBe(false);
  });
});
