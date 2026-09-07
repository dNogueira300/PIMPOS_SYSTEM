import { describe, expect, it } from "vitest";

import { generarSlug } from "./slug";

describe("generarSlug", () => {
  it("pasa a minusculas y une con guiones", () => {
    expect(generarSlug("Pan Frances Chico")).toBe("pan-frances-chico");
  });

  it("quita tildes y enes sin perder la letra", () => {
    expect(generarSlug("Pan Francés Chico")).toBe("pan-frances-chico");
    expect(generarSlug("Ñoño")).toBe("nono");
    expect(generarSlug("Panetón de Navidad")).toBe("paneton-de-navidad");
  });

  it("convierte signos y espacios repetidos en un solo guion", () => {
    expect(generarSlug("Hamburguesa grande S/ 0.40")).toBe("hamburguesa-grande-s-0-40");
    expect(generarSlug("Pan  &  Cía.")).toBe("pan-cia");
  });

  it("no deja guiones en los extremos", () => {
    expect(generarSlug("  ¡Ofertas!  ")).toBe("ofertas");
    expect(generarSlug("---x---")).toBe("x");
  });

  it("devuelve cadena vacia si no queda nada util", () => {
    expect(generarSlug("¡¿?!")).toBe("");
    expect(generarSlug("")).toBe("");
  });
});
