import { describe, expect, it } from "vitest";

import { esquemaNovedad, leerNovedad } from "./novedad";

const fd = (pares: Record<string, string>) => {
  const d = new FormData();
  for (const [k, v] of Object.entries(pares)) d.set(k, v);
  return d;
};

const base = {
  tipo: "promocion",
  titulo: "Dos por uno",
  contenido: "Solo el sábado.",
  intencion: "guardar",
};

describe("esquemaNovedad", () => {
  it("convierte la vigencia de Iquitos a UTC", () => {
    const r = esquemaNovedad.safeParse(
      leerNovedad(
        fd({ ...base, vigencia_inicio: "2026-10-03T06:00", vigencia_fin: "2026-10-03T20:00" }),
      ),
    );
    expect(r.success && r.data.vigencia_inicio).toBe("2026-10-03T11:00:00.000Z");
  });

  it("un fin anterior al inicio se marca en el campo de fin", () => {
    const r = esquemaNovedad.safeParse(
      leerNovedad(
        fd({ ...base, vigencia_inicio: "2026-10-03T20:00", vigencia_fin: "2026-10-03T06:00" }),
      ),
    );
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["vigencia_fin"],
      message: "La fecha de fin tiene que ser después del inicio.",
    });
  });

  it("devolver sin comentario pide explicar qué falta", () => {
    const r = esquemaNovedad.safeParse(leerNovedad(fd({ ...base, intencion: "devolver" })));
    expect(!r.success && r.error.issues[0]).toMatchObject({
      path: ["comentario_revision"],
      message: "Escribe qué hay que corregir antes de devolverla.",
    });
  });

  it("una intención desconocida se rechaza", () => {
    expect(
      esquemaNovedad.safeParse(leerNovedad(fd({ ...base, intencion: "borrar-todo" }))).success,
    ).toBe(false);
  });
});
