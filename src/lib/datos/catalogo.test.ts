import { describe, expect, it } from "vitest";

import { describirPrecio, formatearPrecio, type ProductoPublico } from "./catalogo";

function producto(parcial: Partial<ProductoPublico>): ProductoPublico {
  return {
    id: "1",
    nombre: "Pan francés chico",
    slug: "frances-chico",
    descripcion: null,
    destacado: false,
    categoriaNombre: "Panes clásicos",
    categoriaSlug: "panes-clasicos",
    precioDesde: null,
    precioHasta: null,
    variantes: 0,
    varianteNombre: null,
    varianteUnidad: null,
    imagen: null,
    imagenAlt: null,
    ...parcial,
  };
}

describe("formatearPrecio", () => {
  it("siempre lleva dos decimales", () => {
    // Hay pan a S/ 0.10. Un "S/ 0.1" se lee como un error de la pagina, y este
    // catalogo empieza justo ahi.
    expect(formatearPrecio(0.1)).toBe("S/ 0.10");
    expect(formatearPrecio(2)).toBe("S/ 2.00");
    expect(formatearPrecio(12.5)).toBe("S/ 12.50");
  });
});

describe("describirPrecio", () => {
  it("da el precio exacto cuando solo hay una presentacion", () => {
    expect(describirPrecio(producto({ precioDesde: 0.1, precioHasta: 0.1, variantes: 1 }))).toBe(
      "S/ 0.10",
    );
  });

  it('dice "Desde" cuando las presentaciones cuestan distinto', () => {
    // El caso real: "hamburguesa grande" existe a 0.30 y a 0.40, y son dos
    // variantes de la misma familia. La tarjeta no puede anunciar una sola.
    expect(describirPrecio(producto({ precioDesde: 0.3, precioHasta: 0.4, variantes: 2 }))).toBe(
      "Desde S/ 0.30",
    );
  });

  it("no inventa un rango cuando falta el tope", () => {
    expect(describirPrecio(producto({ precioDesde: 1.5, precioHasta: null }))).toBe("S/ 1.50");
  });

  it("devuelve null si el producto no tiene ninguna variante activa", () => {
    // Pasa cuando todas las presentaciones estan desactivadas. Mostrar
    // "S/ 0.00" seria anunciar que se regala.
    expect(describirPrecio(producto({ precioDesde: null }))).toBeNull();
  });
});
