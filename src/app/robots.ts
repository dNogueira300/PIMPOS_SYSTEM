import type { MetadataRoute } from "next";

import { urlAbsoluta } from "@/lib/sitio";

/**
 * robots.txt (doc 03 §4.4).
 *
 * El panel y la pantalla de ingreso quedan fuera del índice. Ya llevan
 * `noindex` en sus metadatos, pero esto le ahorra al buscador pedir páginas que
 * no va a guardar, y a quien busque "pimpos" en Google encontrarse un
 * formulario de contraseña como primer resultado.
 *
 * No es control de acceso, y conviene no olvidarlo: `robots.txt` es público y
 * cualquiera puede leer qué rutas se piden no indexar. Quien protege el panel
 * es la RLS de Postgres, no este archivo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/ingresar"],
    },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
