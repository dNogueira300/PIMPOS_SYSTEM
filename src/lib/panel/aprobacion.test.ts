import { describe, expect, it } from "vitest";

import { accionesDisponibles, estadoTras, intencionEfectiva } from "./aprobacion";

describe("accionesDisponibles", () => {
  it("el ingeniero no ve «Publicar» en una promoción: ve «Enviar a revisión»", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "borrador")).toEqual([
      "guardar",
      "enviar",
    ]);
  });

  it("una promoción en revisión es de solo lectura para el ingeniero", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "en_revision")).toEqual([]);
  });

  it("el administrador publica o devuelve lo que está en revisión", () => {
    expect(accionesDisponibles("administrador", "promocion", "en_revision")).toEqual([
      "guardar",
      "publicar",
      "devolver",
    ]);
  });

  it("un aviso lo publica cualquiera de contenido, sin revisión", () => {
    expect(accionesDisponibles("ingeniero", "aviso", "borrador")).toEqual(["guardar", "publicar"]);
  });

  it("lo publicado se puede retirar", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "publicado")).toEqual([
      "guardar",
      "archivar",
    ]);
  });

  it("una promoción archivada vuelve a pasar por revisión si la reactiva el ingeniero", () => {
    expect(accionesDisponibles("ingeniero", "promocion", "archivado")).toEqual([
      "guardar",
      "enviar",
    ]);
  });

  it("el repartidor no tiene nada que hacer aquí", () => {
    expect(accionesDisponibles("repartidor", "aviso", "borrador")).toEqual([]);
  });
});

describe("intencionEfectiva", () => {
  it("un aviso que el ingeniero «envía» se publica, porque no se revisa", () => {
    expect(intencionEfectiva("ingeniero", "aviso", "enviar")).toBe("publicar");
  });

  it("una promoción del ingeniero sí va a revisión", () => {
    expect(intencionEfectiva("ingeniero", "promocion", "enviar")).toBe("enviar");
  });
});

describe("estadoTras", () => {
  it("guardar no cambia el estado", () => {
    expect(estadoTras("guardar", "publicado")).toBe("publicado");
  });

  it("cada intención lleva a su estado", () => {
    expect(estadoTras("enviar", "borrador")).toBe("en_revision");
    expect(estadoTras("publicar", "en_revision")).toBe("publicado");
    expect(estadoTras("devolver", "en_revision")).toBe("borrador");
    expect(estadoTras("archivar", "publicado")).toBe("archivado");
  });
});
