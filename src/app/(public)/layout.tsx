import { CascaraPublica } from "@/components/publico/cascara-publica";

/**
 * Layout del sitio publico.
 *
 * Todo lo que pone —cabecera, pie, boton de WhatsApp— esta en `CascaraPublica`,
 * para que el 404 de la raiz pueda ponerse la misma ropa. Ver ese componente.
 */
export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return <CascaraPublica>{children}</CascaraPublica>;
}
