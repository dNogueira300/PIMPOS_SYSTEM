import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { PLANTILLA_PERMISO, VERSION_PERMISO, textoDelPermiso } from "./permiso";

/**
 * La huella de cada versión del texto. Si alguien cambia el texto sin subir
 * `VERSION_PERMISO`, esta prueba falla: la base guarda la VERSIÓN que se leyó
 * a cada cliente, y una versión con dos textos distintos no prueba nada.
 * Para una versión nueva: se añade aquí su huella, sin tocar las anteriores.
 */
const HUELLAS: Record<string, string> = {
  "v1-2026-10": "4dd0dde0c15d50b0e0f691038db63d141ad99994547e43e5456d76e4f63eb8a2",
};

describe("texto del permiso", () => {
  it("la versión actual tiene su huella, y es la del texto", () => {
    const huella = createHash("sha256").update(PLANTILLA_PERMISO).digest("hex");
    expect(HUELLAS[VERSION_PERMISO]).toBe(huella);
  });

  it("dice qué se guarda, quién lo ve, cuánto tiempo y cómo pedir que se borre", () => {
    const texto = textoDelPermiso("947 874 820");
    for (const parte of [
      "nombre",
      "celular",
      "dirección",
      "ubicación",
      "tres fotos",
      "personal de la panadería",
      "dos años",
      "borremos",
      "947 874 820",
    ]) {
      expect(texto).toContain(parte);
    }
    expect(texto).not.toContain("{celular}");
  });
});
