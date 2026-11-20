import { describe, expect, it } from "vitest";

import { comoEstilo, esEstiloDe, opcionesDeEstilo } from "./estilos";

describe("opcionesDeEstilo", () => {
  it("cada temática enseña solo sus estilos, en su orden", () => {
    expect(opcionesDeEstilo("navidad").map((o) => o.nombre)).toEqual([
      "Noche de Navidad",
      "Crema navideña",
    ]);
    expect(opcionesDeEstilo("dia-de-la-madre").map((o) => o.nombre)).toEqual([
      "Rosa sobre crema",
      "Todo en rosa",
    ]);
  });

  it("una temática sin diseño no tiene estilos", () => {
    expect(opcionesDeEstilo("san-juan")).toEqual([]);
  });
});

describe("comoEstilo", () => {
  it("acepta los estilos de la temática", () => {
    expect(comoEstilo("navidad", "crema")).toBe("crema");
    expect(comoEstilo("dia-de-la-madre", "rosa")).toBe("rosa");
  });

  it("lo desconocido, vacío o de otra temática cae en el estilo puesto de esa temática", () => {
    expect(comoEstilo("navidad", null)).toBe("noche");
    expect(comoEstilo("navidad", "neon")).toBe("noche");
    expect(comoEstilo("dia-de-la-madre", null)).toBe("rosa-crema");
    expect(comoEstilo("dia-de-la-madre", "noche")).toBe("rosa-crema");
  });
});

describe("esEstiloDe", () => {
  it("dice si el estilo es de esa temática", () => {
    expect(esEstiloDe("navidad", "noche")).toBe(true);
    expect(esEstiloDe("navidad", "rosa")).toBe(false);
    expect(esEstiloDe("dia-de-la-madre", "rosa-crema")).toBe(true);
    expect(esEstiloDe("san-juan", "noche")).toBe(false);
  });
});
