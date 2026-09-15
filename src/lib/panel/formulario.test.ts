import { describe, expect, it } from "vitest";

import { casilla, entero, json, texto, textoOpcional } from "./formulario";

const datos = (pares: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(pares)) fd.set(k, v);
  return fd;
};

describe("lectura de FormData", () => {
  it("texto recorta espacios y da cadena vacía si falta", () => {
    expect(texto(datos({ nombre: "  Pan francés " }), "nombre")).toBe("Pan francés");
    expect(texto(datos({}), "nombre")).toBe("");
  });

  it("textoOpcional convierte lo vacío en null, que es lo que guarda la base", () => {
    expect(textoOpcional(datos({ descripcion: "   " }), "descripcion")).toBeNull();
    expect(textoOpcional(datos({ descripcion: "Suave" }), "descripcion")).toBe("Suave");
  });

  it("casilla es true solo si viene marcada", () => {
    expect(casilla(datos({ publicado: "on" }), "publicado")).toBe(true);
    expect(casilla(datos({}), "publicado")).toBe(false);
  });

  it("entero devuelve null ante algo que no es un número entero", () => {
    expect(entero(datos({ orden: "3" }), "orden")).toBe(3);
    expect(entero(datos({ orden: "tres" }), "orden")).toBeNull();
    expect(entero(datos({}), "orden")).toBeNull();
  });

  it("json devuelve null si el campo no es JSON válido", () => {
    expect(json(datos({ lista: '[{"a":1}]' }), "lista")).toEqual([{ a: 1 }]);
    expect(json(datos({ lista: "{roto" }), "lista")).toBeNull();
  });
});
