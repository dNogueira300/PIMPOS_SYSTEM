import type { Metadata } from "next";

import { CascaraPublica } from "@/components/publico/cascara-publica";
import { PaginaNoEncontrada } from "@/components/publico/pagina-no-encontrada";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/**
 * El 404 de una direccion que no existe.
 *
 * Next lo pinta dentro del layout raiz, no del de `(public)`, asi que se pone la
 * cascara del sitio a mano. Sin ella, `/esto-no-existe` salia sin cabecera ni
 * pie: una pagina en blanco con un texto, y sin forma de ir a ninguna parte.
 */
export default function NoEncontrado() {
  return (
    <CascaraPublica>
      <PaginaNoEncontrada />
    </CascaraPublica>
  );
}
