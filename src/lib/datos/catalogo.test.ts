import { describe, expect, it } from "vitest";

import {
  agruparPorCategoria,
  describirPrecio,
  describirPresentacion,
  formatearPrecio,
  type ProductoPublico,
} from "./catalogo";

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

describe("describirPresentacion", () => {
  it("calla cuando se vende por unidad, que es lo que se da por hecho", () => {
    // "Unidad" aparecia bajo 32 de los 34 productos. Un pan se vende por
    // unidad: decirlo 32 veces es ruido que tapa las dos veces en que la
    // presentacion si dice algo.
    expect(
      describirPresentacion(
        producto({ variantes: 1, varianteNombre: "Unidad", varianteUnidad: "unidad" }),
      ),
    ).toBeNull();
  });

  it("dice por cuanto se vende cuando no es por unidad", () => {
    expect(
      describirPresentacion(
        producto({ variantes: 1, varianteNombre: "Kilo", varianteUnidad: "kilo" }),
      ),
    ).toBe("Por kilo");
    expect(
      describirPresentacion(
        producto({ variantes: 1, varianteNombre: "Bolsa", varianteUnidad: "bolsa" }),
      ),
    ).toBe("Por bolsa");
  });

  it("deja tal cual un nombre que no es la unidad de venta", () => {
    // "Por grande" no significa nada: el "Por" solo va cuando el nombre ES la
    // unidad en que se vende.
    expect(
      describirPresentacion(
        producto({ variantes: 1, varianteNombre: "Grande", varianteUnidad: "unidad" }),
      ),
    ).toBe("Grande");
  });

  it("con varias presentaciones las cuenta en vez de nombrar una", () => {
    // La hamburguesa grande tiene dos. Nombrar solo la predeterminada haria
    // creer que no hay otra.
    expect(
      describirPresentacion(
        producto({ variantes: 2, varianteNombre: "De S/ 0.30", varianteUnidad: "unidad" }),
      ),
    ).toBe("2 presentaciones");
  });

  it("sin presentacion no hay nada que decir", () => {
    expect(describirPresentacion(producto({ variantes: 0, varianteNombre: null }))).toBeNull();
    expect(describirPresentacion(producto({ variantes: 1, varianteNombre: "  " }))).toBeNull();
  });
});

describe("agruparPorCategoria", () => {
  it("respeta el orden en que llegan, que es el de la base", () => {
    const grupos = agruparPorCategoria([
      producto({ id: "a", categoriaSlug: "panes", categoriaNombre: "Panes" }),
      producto({ id: "b", categoriaSlug: "panes", categoriaNombre: "Panes" }),
      producto({ id: "c", categoriaSlug: "bodega", categoriaNombre: "Bodega" }),
    ]);

    expect(grupos.map((g) => g.nombre)).toEqual(["Panes", "Bodega"]);
    expect(grupos[0].productos.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("junta en un solo grupo una categoria aunque sus productos lleguen separados", () => {
    // No deberia pasar con el orden de la vista, pero una categoria repetida
    // en la pizarra seria un error visible.
    const grupos = agruparPorCategoria([
      producto({ id: "a", categoriaSlug: "panes", categoriaNombre: "Panes" }),
      producto({ id: "b", categoriaSlug: "bodega", categoriaNombre: "Bodega" }),
      producto({ id: "c", categoriaSlug: "panes", categoriaNombre: "Panes" }),
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].productos.map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("los productos sin categoria van juntos, con un nombre que se entiende", () => {
    // Una categoria despublicada deja a sus productos sin nombre de grupo. Un
    // encabezado vacio no le dice nada a nadie.
    const grupos = agruparPorCategoria([
      producto({ id: "a", categoriaSlug: null, categoriaNombre: null }),
    ]);

    expect(grupos).toEqual([
      { nombre: "Otros productos", slug: null, productos: [grupos[0].productos[0]] },
    ]);
  });
});
