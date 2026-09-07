import { describe, expect, it } from "vitest";

import { esRol, esRutaDelPanel, puedeAcceder, rolesConAcceso, ROLES } from "./roles";

describe("esRol", () => {
  it("acepta los cuatro roles del enum", () => {
    for (const rol of ROLES) expect(esRol(rol)).toBe(true);
  });

  it("rechaza cualquier otra cosa", () => {
    // El caso que importa: un claim inventado no debe colarse como rol.
    expect(esRol("gerente_supremo")).toBe(false);
    expect(esRol("SUPERADMIN")).toBe(false);
    expect(esRol(null)).toBe(false);
    expect(esRol(undefined)).toBe(false);
    expect(esRol(1)).toBe(false);
    expect(esRol({ rol: "superadmin" })).toBe(false);
  });
});

describe("esRutaDelPanel", () => {
  it("reconoce las rutas del panel", () => {
    expect(esRutaDelPanel("/admin")).toBe(true);
    expect(esRutaDelPanel("/admin/clientes")).toBe(true);
    expect(esRutaDelPanel("/admin/contenido/productos")).toBe(true);
  });

  it("deja fuera el sitio publico y el ingreso", () => {
    expect(esRutaDelPanel("/")).toBe(false);
    expect(esRutaDelPanel("/productos")).toBe(false);
    expect(esRutaDelPanel("/ingresar")).toBe(false);
  });

  it("no confunde una ruta publica que empiece igual", () => {
    // `/administracion` no es `/admin`: sin esto, el prefijo pillaria de mas.
    expect(esRutaDelPanel("/administracion")).toBe(false);
    expect(esRutaDelPanel("/adminis")).toBe(false);
  });
});

describe("rolesConAcceso", () => {
  it("da preferencia al prefijo mas largo", () => {
    // /admin/usuarios NO debe heredar el acceso abierto de /admin.
    expect(rolesConAcceso("/admin/usuarios")).toEqual(["superadmin", "administrador"]);
    expect(rolesConAcceso("/admin")).toEqual([
      "superadmin",
      "administrador",
      "ingeniero",
      "repartidor",
    ]);
  });

  it("devuelve null fuera del panel", () => {
    expect(rolesConAcceso("/galeria")).toBeNull();
  });
});

describe("puedeAcceder", () => {
  it("sin rol no se entra a ninguna parte del panel", () => {
    // Es el caso de un usuario recien creado y aun inactivo: tiene sesion
    // valida pero el hook le emite `rol: null`.
    expect(puedeAcceder(null, "/admin")).toBe(false);
    expect(puedeAcceder(null, "/admin/clientes")).toBe(false);
    expect(puedeAcceder(null, "/admin/usuarios")).toBe(false);
  });

  it("sin rol si se entra al sitio publico", () => {
    expect(puedeAcceder(null, "/")).toBe(true);
    expect(puedeAcceder(null, "/productos")).toBe(true);
  });

  it("el superadmin entra a todo", () => {
    for (const ruta of [
      "/admin",
      "/admin/contenido/productos",
      "/admin/insumos",
      "/admin/clientes",
      "/admin/usuarios",
      "/admin/auditoria",
      "/admin/configuracion",
    ]) {
      expect(puedeAcceder("superadmin", ruta)).toBe(true);
    }
  });

  it("el administrador entra a todo salvo lo que la base le niega", () => {
    // Eliminar usuarios es cosa del superadmin, pero eso lo impone la RLS
    // sobre la fila; la seccion si la ve.
    expect(puedeAcceder("administrador", "/admin/usuarios")).toBe(true);
    expect(puedeAcceder("administrador", "/admin/auditoria")).toBe(true);
  });

  it("el ingeniero gestiona contenido e insumos, no usuarios ni auditoria", () => {
    expect(puedeAcceder("ingeniero", "/admin/contenido/novedades")).toBe(true);
    expect(puedeAcceder("ingeniero", "/admin/insumos")).toBe(true);
    expect(puedeAcceder("ingeniero", "/admin/clientes")).toBe(true);
    expect(puedeAcceder("ingeniero", "/admin/usuarios")).toBe(false);
    expect(puedeAcceder("ingeniero", "/admin/auditoria")).toBe(false);
    expect(puedeAcceder("ingeniero", "/admin/configuracion")).toBe(false);
  });

  it("el repartidor solo llega a clientes y al tablero", () => {
    expect(puedeAcceder("repartidor", "/admin")).toBe(true);
    expect(puedeAcceder("repartidor", "/admin/clientes")).toBe(true);
    expect(puedeAcceder("repartidor", "/admin/clientes/nuevo")).toBe(true);
    // Estas son las que la ficha le niega expresamente.
    expect(puedeAcceder("repartidor", "/admin/insumos")).toBe(false);
    expect(puedeAcceder("repartidor", "/admin/contenido/productos")).toBe(false);
    expect(puedeAcceder("repartidor", "/admin/usuarios")).toBe(false);
  });
});
