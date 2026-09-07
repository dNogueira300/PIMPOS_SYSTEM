import { describe, expect, it } from "vitest";

import { aCanales, contraste, cumpleAA, luminancia } from "./contraste";

describe("aCanales", () => {
  it("acepta la forma larga y la corta", () => {
    expect(aCanales("#12306E")).toEqual([18, 48, 110]);
    expect(aCanales("12306E")).toEqual([18, 48, 110]);
    expect(aCanales("#fff")).toEqual([255, 255, 255]);
  });

  it("rechaza lo que no es un color", () => {
    expect(() => aCanales("azul")).toThrow(/hexadecimal/);
    expect(() => aCanales("#12345")).toThrow(/hexadecimal/);
    expect(() => aCanales("#GGGGGG")).toThrow(/hexadecimal/);
  });
});

describe("luminancia", () => {
  it("va de 0 en negro a 1 en blanco", () => {
    expect(luminancia("#000000")).toBe(0);
    expect(luminancia("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("contraste", () => {
  it("da 21 en el par de maximo contraste", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });

  it("da 1 con dos colores iguales", () => {
    expect(contraste("#C8801F", "#C8801F")).toBeCloseTo(1, 5);
  });

  it("no depende del orden de los argumentos", () => {
    expect(contraste("#231A14", "#F7EFE2")).toBeCloseTo(contraste("#F7EFE2", "#231A14"), 10);
  });

  it("coincide con valores conocidos de la paleta", () => {
    // Comprobados contra la formula de WCAG; si estos cambian, algo se rompio.
    expect(contraste("#231A14", "#F7EFE2")).toBeCloseTo(14.97, 1);
    expect(contraste("#C8801F", "#F7EFE2")).toBeCloseTo(2.8, 1);
  });
});

describe("cumpleAA", () => {
  it("aprueba la tinta sobre crema y rechaza el dorado claro", () => {
    expect(cumpleAA("#231A14", "#F7EFE2")).toBe(true);
    expect(cumpleAA("#C8801F", "#F7EFE2")).toBe(false);
  });

  it("el dorado de marca no alcanza ni el umbral de texto grande", () => {
    // Esto corrige lo que decia el plan (doc 03 §3.4): no basta con reservarlo
    // para texto de 18 px o mas, tampoco llega ahi.
    expect(cumpleAA("#C8801F", "#F7EFE2", 3)).toBe(false);
  });
});
