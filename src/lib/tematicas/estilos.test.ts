import { describe, expect, it } from "vitest";

import { ESTILOS, OPCIONES_DE_ESTILO, comoEstilo } from "./estilos";

describe("comoEstilo", () => {
  it("acepta los estilos que tienen diseño", () => {
    expect(comoEstilo("noche")).toBe("noche");
    expect(comoEstilo("crema")).toBe("crema");
  });

  it("lo desconocido o vacío cae en la noche, el estilo puesto de Navidad", () => {
    expect(comoEstilo(null)).toBe("noche");
    expect(comoEstilo("neon")).toBe("noche");
  });
});

describe("OPCIONES_DE_ESTILO", () => {
  it("nombra cada estilo, en el orden de la lista", () => {
    expect(OPCIONES_DE_ESTILO.map((o) => o.valor)).toEqual([...ESTILOS]);
    expect(OPCIONES_DE_ESTILO.map((o) => o.nombre)).toEqual(["Noche de Navidad", "Crema navideña"]);
  });
});
