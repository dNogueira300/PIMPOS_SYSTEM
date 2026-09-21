import { describe, expect, it } from "vitest";

import { esquemaProducto, leerProducto, normalizarPrecio } from "./producto";

const CATEGORIA = "5b1f7c1e-3c4d-4e5f-8a9b-0c1d2e3f4a5b";

function fd(pares: Record<string, string>) {
  const datos = new FormData();
  for (const [k, v] of Object.entries(pares)) datos.set(k, v);
  return datos;
}

const presentaciones = (lista: unknown[]) => JSON.stringify(lista);

describe("normalizarPrecio", () => {
  it("acepta coma, punto, el símbolo y espacios", () => {
    expect(normalizarPrecio("0,4")).toBe("0.4");
    expect(normalizarPrecio(" S/ 1.50 ")).toBe("1.50");
    expect(normalizarPrecio("s/.2")).toBe("2");
  });
});

describe("esquemaProducto", () => {
  it("un producto con una presentación es válido y el precio queda como texto exacto", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan francés",
          categoria_id: CATEGORIA,
          publicado: "on",
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "0,10", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(r.success).toBe(true);
    expect(r.success && r.data.presentaciones[0]?.precio).toBe("0.10");
  });

  it("sin presentaciones pide añadir una", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(fd({ nombre: "Pan", categoria_id: CATEGORIA, presentaciones: "[]" })),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Añade al menos una presentación con su precio.",
    );
  });

  it("un precio con letras dice cómo escribirlo", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: CATEGORIA,
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "diez", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Escribe el precio con números, por ejemplo 0.40.",
    );
  });

  it("sin categoría pide elegirla", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: "",
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "1", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain("Elige una categoría.");
  });

  it("una presentación repetida por nombre se rechaza", () => {
    const r = esquemaProducto.safeParse(
      leerProducto(
        fd({
          nombre: "Pan",
          categoria_id: CATEGORIA,
          presentaciones: presentaciones([
            { id: null, nombre: "Unidad", precio: "1", unidad_venta: "unidad" },
            { id: null, nombre: "unidad", precio: "2", unidad_venta: "unidad" },
          ]),
        }),
      ),
    );
    expect(!r.success && r.error.issues.map((i) => i.message)).toContain(
      "Hay dos presentaciones con el mismo nombre.",
    );
  });
});
