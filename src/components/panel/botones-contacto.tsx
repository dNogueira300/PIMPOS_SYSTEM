import { MessageCircle, Navigation, Phone } from "lucide-react";

import { enlaceComoLlegar, enlaceLlamar, enlaceWhatsAppCliente } from "@/lib/clientes/contacto";

type Props = {
  nombre: string;
  celular: string;
  latitud: number | null;
  longitud: number | null;
  /** En la ficha van con su texto; en la lista, solo el icono (con su nombre accesible). */
  grande?: boolean;
};

const CIRCULO =
  "text-primary hover:bg-primary/10 inline-flex size-11 items-center justify-center rounded-md";

/** Decisión 7: la ruta de reparto es la lista con estos tres botones. */
export function BotonesContacto({ nombre, celular, latitud, longitud, grande = false }: Props) {
  const whatsapp = enlaceWhatsAppCliente(celular);
  const llegar = enlaceComoLlegar(latitud, longitud);
  const botones = [
    { href: enlaceLlamar(celular), texto: "Llamar", icono: Phone, externo: false },
    ...(whatsapp
      ? [{ href: whatsapp, texto: "WhatsApp", icono: MessageCircle, externo: true }]
      : []),
    ...(llegar ? [{ href: llegar, texto: "Cómo llegar", icono: Navigation, externo: true }] : []),
  ];
  return (
    <>
      {botones.map(({ href, texto, icono: Icono, externo }) => (
        <a
          key={texto}
          href={href}
          {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={grande ? undefined : `${texto}: ${nombre}`}
          className={grande ? "boton-linea" : CIRCULO}
        >
          <Icono aria-hidden className="size-5" />
          {grande ? texto : null}
        </a>
      ))}
    </>
  );
}
