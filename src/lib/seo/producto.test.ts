import { describe, expect, it } from "vitest";

import type { ProductoPublico } from "@/lib/datos/catalogo";
import { serializarJsonLd } from "./datos-estructurados";
import { productoSchema } from "./producto";

const URL_PRODUCTO = "https://www.panaderiapimpos.com/productos/prueba";

function crearProducto(parcial: Partial<ProductoPublico> = {}): ProductoPublico {
  return {
    id: "prueba",
    nombre: "Producto de prueba",
    slug: "prueba",
    descripcion: null,
    destacado: false,
    categoriaNombre: null,
    categoriaSlug: null,
    precioDesde: null,
    precioHasta: null,
    variantes: 0,
    varianteNombre: null,
    varianteUnidad: null,
    imagen: null,
    imagenAlt: null,
    presentaciones: [],
    ...parcial,
  };
}

describe("productoSchema", () => {
  it("conserva la identidad, descripción, imagen y categoría del catálogo", () => {
    const datos = productoSchema(
      crearProducto({
        descripcion: "Descripción confirmada por el negocio.",
        imagen: "https://example.com/pan.webp",
        categoriaNombre: "Panes clásicos",
      }),
      URL_PRODUCTO,
    );
    expect(datos).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${URL_PRODUCTO}#producto`,
      url: URL_PRODUCTO,
      name: "Producto de prueba",
      description: "Descripción confirmada por el negocio.",
      image: "https://example.com/pan.webp",
      category: "Panes clásicos",
    });
  });

  it.each([0.1, 0, 0.125])(
    "conserva el precio vigente %s PEN de la única presentación",
    (precio) => {
      const producto = crearProducto({
        precioDesde: 99,
        presentaciones: [{ id: "unidad", nombre: "Unidad", precio, unidad: "unidad" }],
      });
      expect(productoSchema(producto, URL_PRODUCTO)).toHaveProperty("offers", {
        "@type": "Offer",
        price: precio,
        priceCurrency: "PEN",
        name: "Unidad",
        url: URL_PRODUCTO,
      });
    },
  );

  it.each([null, NaN, Infinity, -Infinity, -0.1])("omite el precio inválido %s", (precio) => {
    const producto = crearProducto({
      precioDesde: 0.1,
      presentaciones: [{ id: "unidad", nombre: "Unidad", precio, unidad: "unidad" }],
    });
    expect(productoSchema(producto, URL_PRODUCTO)).not.toHaveProperty("offers");
  });

  it("no convierte el mínimo de varias presentaciones en una oferta del producto", () => {
    const producto = crearProducto({
      precioDesde: 0.4,
      presentaciones: [
        { id: "chico", nombre: "Chico", precio: 0.4, unidad: "unidad" },
        { id: "grande", nombre: "Grande", precio: 0.6, unidad: "unidad" },
      ],
    });
    expect(productoSchema(producto, URL_PRODUCTO)).not.toHaveProperty("offers");
  });

  it("no inventa campos ausentes ni precios sin presentaciones", () => {
    const datos = productoSchema(crearProducto({ precioDesde: 0.1 }), URL_PRODUCTO);
    for (const campo of [
      "description",
      "image",
      "category",
      "offers",
      "brand",
      "review",
      "aggregateRating",
    ]) {
      expect(datos).not.toHaveProperty(campo);
    }
  });

  it("no inventa existencias, valoraciones o vigencia y conserva el escape seguro", () => {
    const producto = crearProducto({
      descripcion: "Pan </script><script>alert(1)</script>",
      presentaciones: [{ id: "unidad", nombre: "Unidad", precio: 0.1, unidad: "unidad" }],
    });
    const datos = productoSchema(producto, URL_PRODUCTO);
    const texto = serializarJsonLd(datos);
    expect(texto).not.toMatch(/availability|aggregateRating|review|brand|priceValidUntil/);
    expect(texto).not.toContain("<");
    expect(JSON.parse(texto)).toEqual(datos);
  });
});
