import { describe, expect, it } from "vitest";

import { leerTodas } from "./paginas";

/** Una tabla de `total` filas servida como PostgREST: nunca más de `tope` por respuesta. */
function tabla(total: number, tope: number) {
  const filas = Array.from({ length: total }, (_, i) => i);
  const pedidas: [number, number][] = [];
  const pedir = async (desde: number, hasta: number) => {
    pedidas.push([desde, hasta]);
    return { data: filas.slice(desde, Math.min(hasta + 1, desde + tope)), error: null };
  };
  return { pedir, pedidas };
}

describe("leerTodas", () => {
  it("con más filas que el tope de PostgREST, las trae todas (revisión de T6)", async () => {
    const { pedir } = tabla(2500, 1000);
    const r = await leerTodas(pedir, 1000);
    expect(r.error).toBeNull();
    expect(r.data).toHaveLength(2500);
    expect(r.data?.at(-1)).toBe(2499);
  });

  it("una tabla justo en el tamaño de página pide una más y para", async () => {
    const { pedir, pedidas } = tabla(1000, 1000);
    expect((await leerTodas(pedir, 1000)).data).toHaveLength(1000);
    expect(pedidas).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it("si una página falla, devuelve el error y no una lista a medias", async () => {
    let n = 0;
    const r = await leerTodas(async () => {
      n += 1;
      return n === 1
        ? { data: Array.from({ length: 10 }, (_, i) => i), error: null }
        : { data: null, error: { message: "caída" } };
    }, 10);
    expect(r).toEqual({ data: null, error: { message: "caída" } });
  });
});
