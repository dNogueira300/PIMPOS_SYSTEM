import type { Metadata } from "next";

import { PaginaNoEncontrada } from "@/components/publico/pagina-no-encontrada";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/**
 * El 404 de dentro del sitio: un `notFound()` en una seccion, como un producto
 * o una novedad que ya no estan publicados. Ya va dentro del layout publico, con
 * su cabecera y su pie.
 */
export default function NoEncontradoEnElSitio() {
  return <PaginaNoEncontrada />;
}
