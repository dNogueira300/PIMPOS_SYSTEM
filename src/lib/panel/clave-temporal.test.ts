import { describe, expect, it } from "vitest";

import { ALFABETO_CLAVE, generarClaveTemporal } from "./clave-temporal";

describe("generarClaveTemporal", () => {
  it("tiene 12 caracteres, al menos 10 que exige Auth", () => {
    expect(generarClaveTemporal()).toHaveLength(12);
  });

  it("no usa letras que se confunden al dictarlas o copiarlas a mano", () => {
    for (let i = 0; i < 200; i++) {
      expect(generarClaveTemporal()).not.toMatch(/[0O1lI]/);
    }
  });

  it("siempre lleva mayúscula, minúscula y número", () => {
    for (let i = 0; i < 200; i++) {
      const clave = generarClaveTemporal();
      expect(clave).toMatch(/[A-Z]/);
      expect(clave).toMatch(/[a-z]/);
      expect(clave).toMatch(/[2-9]/);
    }
  });

  it("aunque el azar no las traiga: con todo ceros sigue llevando las tres clases", () => {
    const ceros = (n: number) => new Uint32Array(n);
    const clave = generarClaveTemporal(ceros);
    expect(clave).toMatch(/[A-Z]/);
    expect(clave).toMatch(/[a-z]/);
    expect(clave).toMatch(/[2-9]/);
  });

  it("solo usa su alfabeto", () => {
    const clave = generarClaveTemporal();
    expect([...clave].every((c) => ALFABETO_CLAVE.includes(c))).toBe(true);
  });

  it("con el mismo azar sale la misma clave (se puede probar sin suerte)", () => {
    const azar = (n: number) => Uint32Array.from({ length: n }, (_, i) => i * 7919);
    expect(generarClaveTemporal(azar)).toBe(generarClaveTemporal(azar));
  });

  it("dos claves seguidas no se repiten", () => {
    expect(generarClaveTemporal()).not.toBe(generarClaveTemporal());
  });
});
