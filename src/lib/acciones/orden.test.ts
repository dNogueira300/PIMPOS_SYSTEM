import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OpcionesAccion } from "@/lib/panel/accion";

/**
 * `moverFila` recibe `tabla` y `hacia` del navegador: una Server Action se
 * puede llamar con cualquier valor. Uno que no está en la lista tiene que
 * devolver el error de siempre, no tirar un 500 antes de comprobar el acceso.
 */
const llamadas: string[] = [];

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("@/lib/panel/accion", () => ({
  ejecutarAccion: async (op: OpcionesAccion<never>) => {
    llamadas.push(op.ruta);
    return { estado: "ok", mensaje: "Orden cambiado." };
  },
}));

const { moverFila } = await import("./orden");

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  llamadas.length = 0;
});

describe("moverFila", () => {
  it("con una tabla conocida, pasa por ejecutarAccion con su ruta", async () => {
    const r = await moverFila("faqs", ID, "arriba");
    expect(r.estado).toBe("ok");
    expect(llamadas).toEqual(["/admin/contenido/preguntas"]);
  });

  it("con una tabla que no existe, devuelve el error de siempre y no toca nada", async () => {
    const r = await moverFila("perfiles" as never, ID, "arriba");
    expect(r).toMatchObject({ estado: "error" });
    expect(llamadas).toEqual([]);
  });

  it("con una tabla que es una propiedad heredada, tampoco", async () => {
    const r = await moverFila("toString" as never, ID, "arriba");
    expect(r).toMatchObject({ estado: "error" });
    expect(llamadas).toEqual([]);
  });

  it("con una dirección que no es arriba ni abajo, tampoco", async () => {
    const r = await moverFila("faqs", ID, "al-fondo" as never);
    expect(r).toMatchObject({ estado: "error" });
    expect(llamadas).toEqual([]);
  });
});
