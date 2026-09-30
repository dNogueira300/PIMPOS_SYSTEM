import { describe, expect, it } from "vitest";

import { esSeccionActiva, seccionesPara } from "./navegacion";

const nombres = (rol: Parameters<typeof seccionesPara>[0]) =>
  seccionesPara(rol).map((s) => s.nombre);

describe("seccionesPara", () => {
  it("el administrador ve clientes después de insumos", () => {
    expect(nombres("administrador")).toEqual([
      "Inicio",
      "Contenido",
      "Insumos",
      "Clientes",
      "Usuarios",
      "Configuración",
    ]);
  });

  it("el ingeniero ve inicio, contenido, insumos y clientes", () => {
    expect(nombres("ingeniero")).toEqual(["Inicio", "Contenido", "Insumos", "Clientes"]);
  });

  it("el repartidor ve el inicio y clientes (F6)", () => {
    expect(nombres("repartidor")).toEqual(["Inicio", "Clientes"]);
  });

  it("la barra inferior nunca lleva más de cuatro botones propios", () => {
    for (const rol of ["superadmin", "administrador", "ingeniero", "repartidor"] as const) {
      expect(seccionesPara(rol).filter((s) => s.enBarraInferior).length).toBeLessThanOrEqual(4);
    }
  });
});

describe("esSeccionActiva", () => {
  it("una subruta activa a su sección", () => {
    expect(esSeccionActiva("/admin/contenido/productos/abc", "/admin/contenido")).toBe(true);
  });

  it("el inicio solo se activa en /admin exacto", () => {
    expect(esSeccionActiva("/admin/contenido", "/admin")).toBe(false);
    expect(esSeccionActiva("/admin", "/admin")).toBe(true);
  });

  it("un prefijo que no es carpeta no cuenta", () => {
    expect(esSeccionActiva("/admin/contenidos", "/admin/contenido")).toBe(false);
  });
});
