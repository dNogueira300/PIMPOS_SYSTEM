import { MessageCircle } from "lucide-react";

/**
 * Boton flotante de WhatsApp (R4).
 *
 * Solo en movil: en escritorio ya esta en la cabecera, y repetirlo taparia
 * contenido sin ganar nada. El pedido por WhatsApp es como de verdad compra el
 * cliente de esta panaderia, asi que no es un adorno de esquina.
 */
export function BotonWhatsApp({ enlace }: { enlace: string | null }) {
  if (enlace === null) return null;

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className="boton-cta fixed right-4 bottom-4 z-30 rounded-full shadow-lg shadow-black/20 sm:hidden"
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="font-semibold">Pedir</span>
      <span className="sr-only">por WhatsApp</span>
    </a>
  );
}
