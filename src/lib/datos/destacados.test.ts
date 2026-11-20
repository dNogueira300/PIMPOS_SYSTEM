import { describe, expect, it } from "vitest";

import type { ProductoPublico } from "./catalogo";
import { repartirPorFoto } from "./destacados";

function producto(nombre: string, imagen: string | null): ProductoPublico {
  return {
    id: nombre,
    nombre,
    slug: nombre.toLowerCase(),
    descripcion: null,
    destacado: true,
    categoriaNombre: null,
    categoriaSlug: null,
    precioDesde: 0.1,
    precioHasta: 0.1,
    variantes: 1,
    varianteNombre: null,
    varianteUnidad: null,
    imagen,
    imagenAlt: null,
    presentaciones: [],
  };
}

// Decisión de Dan (13/09/2026): en la portada, tarjeta con foto solo para los
// productos que la tienen. 32 de 34 no tienen: en tarjetas salían 32 cajas
// iguales, que es lo que originó la pizarra el 11/09.

describe("repartirPorFoto", () => {
  it("separa los que tienen foto de los que no, sin cambiar el orden", () => {
    const { conFoto, sinFoto } = repartirPorFoto([
      producto("Leche", "leche.webp"),
      producto("Francés", null),
      producto("Chancay", "chancay.webp"),
    ]);
    expect(conFoto.map((p) => p.nombre)).toEqual(["Leche", "Chancay"]);
    expect(sinFoto.map((p) => p.nombre)).toEqual(["Francés"]);
  });

  it("una cadena vacía no cuenta como foto", () => {
    const { conFoto, sinFoto } = repartirPorFoto([producto("Leche", "")]);
    expect(conFoto).toEqual([]);
    expect(sinFoto).toHaveLength(1);
  });

  it("los ocho destacados con foto van todos en tarjeta (pedido de Dan, 19/11/2026)", () => {
    const ocho = ["a", "b", "c", "d", "e", "f", "g", "h"].map((n) => producto(n, `${n}.webp`));
    const { conFoto, sinFoto } = repartirPorFoto(ocho);
    expect(conFoto.map((p) => p.nombre)).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
    expect(sinFoto).toEqual([]);
  });

  it("limita las tarjetas a ocho, dos filas en escritorio", () => {
    const muchos = ["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((n) =>
      producto(n, `${n}.webp`),
    );
    const { conFoto, sinFoto } = repartirPorFoto(muchos);
    expect(conFoto).toHaveLength(8);
    // El noveno no se pierde: baja a la pizarra, con su miniatura.
    expect(sinFoto.map((p) => p.nombre)).toEqual(["i"]);
  });
});
