import { describe, expect, it } from "vitest";

import { reordenar } from "./orden";

describe("reordenar", () => {
  it("subir intercambia con la anterior y devuelve solo lo que cambia", () => {
    expect(reordenar(["a", "b", "c"], "c", "arriba")).toEqual([
      { id: "c", orden: 1 },
      { id: "b", orden: 2 },
    ]);
  });

  it("bajar intercambia con la siguiente", () => {
    expect(reordenar(["a", "b", "c"], "a", "abajo")).toEqual([
      { id: "b", orden: 0 },
      { id: "a", orden: 1 },
    ]);
  });

  it("en un extremo no hay nada que cambiar", () => {
    expect(reordenar(["a", "b"], "a", "arriba")).toEqual([]);
    expect(reordenar(["a", "b"], "b", "abajo")).toEqual([]);
  });

  it("un id que no está no cambia nada", () => {
    expect(reordenar(["a", "b"], "z", "arriba")).toEqual([]);
  });

  it("si los órdenes estaban repetidos, los normaliza a su posición", () => {
    // Las semillas dejan muchos `orden = 0`: la primera vez se escriben todos.
    expect(reordenar(["a", "b", "c"], "b", "arriba", [0, 0, 0])).toEqual([
      { id: "b", orden: 0 },
      { id: "a", orden: 1 },
      { id: "c", orden: 2 },
    ]);
  });
});
