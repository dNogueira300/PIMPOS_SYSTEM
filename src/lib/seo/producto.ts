import type { ProductoPublico } from "@/lib/datos/catalogo";
import { urlAbsoluta } from "@/lib/sitio";

/** Describe el catálogo publicado sin deducir marca, existencias o reseñas. */
export function productoSchema(producto: ProductoPublico, urlProducto: string) {
  const unica = producto.presentaciones.length === 1 ? producto.presentaciones[0] : null;
  const precio = unica?.precio;
  // El mínimo de varias presentaciones no es el precio de una oferta única.
  // Sin rutas de variantes, esas fichas mantienen solo su descripción.
  const oferta =
    unica && typeof precio === "number" && Number.isFinite(precio) && precio >= 0
      ? {
          "@type": "Offer",
          price: precio,
          priceCurrency: "PEN",
          name: unica.nombre,
          url: urlProducto,
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${urlProducto}#producto`,
    url: urlProducto,
    name: producto.nombre,
    ...(producto.descripcion ? { description: producto.descripcion } : {}),
    ...(producto.imagen ? { image: urlAbsoluta(producto.imagen) } : {}),
    ...(producto.categoriaNombre ? { category: producto.categoriaNombre } : {}),
    ...(oferta ? { offers: oferta } : {}),
  };
}
