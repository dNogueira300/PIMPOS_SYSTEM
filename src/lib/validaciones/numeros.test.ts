import { describe, expect, it } from "vitest";

import {
  cantidadOCero,
  cantidadPositiva,
  normalizarNumero,
  precio,
  precioOpcional,
} from "./numeros";

describe("normalizarNumero", () => {
  it("acepta la coma, el símbolo del sol y los espacios", () => {
    expect(normalizarNumero(" 1,5 ")).toBe("1.5");
    expect(normalizarNumero("S/ 3,50")).toBe("3.50");
  });
});

describe("cantidadPositiva", () => {
  const esquema = cantidadPositiva("Escribe la cantidad.");

  it("devuelve el texto normalizado, no un número", () => {
    expect(esquema.parse("1,5")).toBe("1.5");
    expect(esquema.parse("0.0005")).toBe("0.0005");
  });

  it("rechaza el cero, lo negativo y lo que no es número", () => {
    expect(esquema.safeParse("0").success).toBe(false);
    expect(esquema.safeParse("-2").success).toBe(false);
    expect(esquema.safeParse("dos").success).toBe(false);
    expect(esquema.safeParse("").success).toBe(false);
    expect(esquema.safeParse("1.23456").success).toBe(false);
  });
});

describe("cantidadOCero", () => {
  it("admite el cero", () => {
    expect(cantidadOCero("Escribe el mínimo.").parse("0")).toBe("0");
  });
});

describe("precio", () => {
  it("es obligatorio", () => {
    expect(precio("Escribe el precio.").safeParse("").success).toBe(false);
    expect(precio("Escribe el precio.").parse("150,5")).toBe("150.5");
  });
});

describe("precioOpcional", () => {
  const esquema = precioOpcional("Escribe el precio con números.");

  it("vacío es null", () => {
    expect(esquema.parse("")).toBeNull();
  });

  it("normaliza y deja dos decimales como mucho", () => {
    expect(esquema.parse("S/ 150")).toBe("150");
    expect(esquema.safeParse("1.234").success).toBe(false);
  });
});
