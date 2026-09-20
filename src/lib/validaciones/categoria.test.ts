import { describe, expect, it } from "vitest";

import { esquemaCategoria, leerCategoria } from "./categoria";

const fd = (pares: Record<string, string>) => {
  const datos = new FormData();
  for (const [k, v] of Object.entries(pares)) datos.set(k, v);
  return datos;
};

describe("esquemaCategoria", () => {
  it("una categoría nueva publicada es válida", () => {
    const r = esquemaCategoria.safeParse(
      leerCategoria(fd({ nombre: "Panes dulces", publicado: "on" })),
    );
    expect(r.success).toBe(true);
    expect(r.success && r.data).toMatchObject({
      id: null,
      nombre: "Panes dulces",
      publicado: true,
    });
  });

  it("sin nombre dice qué escribir", () => {
    const r = esquemaCategoria.safeParse(leerCategoria(fd({ nombre: "  " })));
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0]?.message).toBe("Escribe el nombre de la categoría.");
  });

  it("un nombre sin letras ni números no da dirección web y se rechaza", () => {
    const r = esquemaCategoria.safeParse(leerCategoria(fd({ nombre: "¿¿??" })));
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "El nombre necesita al menos una letra o un número.",
    );
  });
});
