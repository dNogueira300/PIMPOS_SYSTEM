import { describe, expect, it } from "vitest";

import { rutaDeSubida, validarArchivo } from "./imagen";

describe("validarArchivo", () => {
  it("acepta una foto normal de celular", () => {
    expect(validarArchivo({ type: "image/jpeg", size: 4 * 1024 * 1024 })).toBeNull();
  });

  it("rechaza lo que no es una imagen, diciendo qué hacer", () => {
    expect(validarArchivo({ type: "application/pdf", size: 1000 })).toBe(
      "Ese archivo no es una foto. Elige una imagen (JPG, PNG o WebP).",
    );
  });

  it("rechaza una foto de más de 20 MB antes de intentar comprimirla", () => {
    expect(validarArchivo({ type: "image/png", size: 21 * 1024 * 1024 })).toBe(
      "La foto pesa más de 20 MB. Elige otra o tómala con menos calidad.",
    );
  });
});

describe("rutaDeSubida", () => {
  it("arma carpeta/id.webp y limpia barras sobrantes", () => {
    expect(rutaDeSubida("/productos/abc/", "123")).toBe("productos/abc/123.webp");
  });

  it("respeta la extensión si no se comprime", () => {
    expect(rutaDeSubida("marca", "123", "svg")).toBe("marca/123.svg");
  });
});
