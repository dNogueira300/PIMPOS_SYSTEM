import { describe, expect, it } from "vitest";

import { traducirError } from "./errores";

describe("traducirError", () => {
  it("un nombre repetido dice qué cambiar", () => {
    expect(traducirError({ code: "23505", message: "duplicate key" }, "un producto")).toBe(
      "Ya hay un producto con ese nombre. Cámbialo e inténtalo otra vez.",
    );
  });

  it("la RLS se explica como falta de permiso, sin jerga", () => {
    const mensaje = traducirError(
      { code: "42501", message: "new row violates row-level security policy" },
      "una novedad",
    );
    expect(mensaje).toBe(
      "Tu rol no permite hacer esto. Si crees que debería, habla con un administrador.",
    );
  });

  it("una regla propia de la base se muestra tal cual, porque ya está escrita para personas", () => {
    expect(
      traducirError(
        { code: "23514", message: "Las promociones requieren aprobacion de un administrador" },
        "una novedad",
      ),
    ).toBe("Las promociones requieren aprobacion de un administrador");
  });

  it("un check genérico de Postgres no se enseña", () => {
    expect(
      traducirError(
        { code: "23514", message: 'new row for relation "slides" violates check constraint "x"' },
        "un slide",
      ),
    ).toBe("Algún dato no cumple las reglas. Revisa lo que escribiste.");
  });

  it("algo en uso no se puede borrar", () => {
    expect(traducirError({ code: "23503", message: "fk" }, "la categoría")).toBe(
      "No se puede: la categoría todavía se usa en otra parte.",
    );
  });

  it("lo desconocido pide revisar la conexión, nunca enseña el código", () => {
    const mensaje = traducirError({ code: "XX000", message: "internal" }, "un producto");
    expect(mensaje).toBe("No se pudo guardar. Revisa tu conexión e inténtalo otra vez.");
    expect(mensaje).not.toContain("XX000");
  });
});
