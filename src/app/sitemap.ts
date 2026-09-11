import type { MetadataRoute } from "next";

import { SECCIONES } from "@/components/publico/navegacion";
import { listarProductos } from "@/lib/datos/catalogo";
import { listarNovedades } from "@/lib/datos/contenido";
import { urlAbsoluta } from "@/lib/sitio";

/**
 * sitemap.xml (doc 03 §4.4), generado desde la base.
 *
 * Sale de las mismas lecturas que el sitio, así que cuando el panel publique un
 * producto (F4) y se invalide la etiqueta `catalogo`, el producto aparece aquí
 * sin tocar este archivo. Un sitemap escrito a mano se queda viejo el primer
 * día que alguien añade un pan.
 *
 * Sin `lastModified`, a propósito. Las vistas públicas no exponen la fecha de
 * modificación, y la alternativa habitual, `new Date()`, tendría dos problemas:
 * con Cache Components rompe el build por ser un valor que cambia entre
 * renderizados, y además mentiría — le diría a Google que todo el catálogo
 * cambió hoy, cada vez que lo pida. Sin fecha, el buscador decide por su cuenta,
 * que es mejor que decidir con un dato falso.
 *
 * Tampoco `priority` ni `changeFrequency`: Google documenta que los ignora.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, novedades] = await Promise.all([listarProductos(), listarNovedades()]);

  return [
    { url: urlAbsoluta("/") },
    ...SECCIONES.map(({ ruta }) => ({ url: urlAbsoluta(ruta) })),
    ...productos.map(({ slug }) => ({ url: urlAbsoluta(`/productos/${slug}`) })),
    // Solo lo vigente: `listarNovedades` lee una vista que ya descarta lo
    // caducado, así que una promoción vencida sale del sitemap el mismo día.
    ...novedades.map(({ slug }) => ({ url: urlAbsoluta(`/novedades/${slug}`) })),
  ];
}
