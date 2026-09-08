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
      className="bg-cta text-cta-foreground focus-visible:outline-ring min-h-tactil fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full px-5 shadow-lg shadow-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="font-semibold">Pedir</span>
      <span className="sr-only">por WhatsApp</span>
    </a>
  );
}
