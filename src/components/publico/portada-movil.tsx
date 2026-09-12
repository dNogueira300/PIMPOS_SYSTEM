import Image from "next/image";
import { MessageCircle } from "lucide-react";

import { EstadoAhora } from "@/components/publico/estado-ahora";
import type { Tramo } from "@/lib/datos/reloj";
import type { Slide } from "@/lib/datos/contenido";

/**
 * La portada del celular, sin carrusel (decision de Dan, 12/09/2026).
 *
 * En escritorio el carrusel se queda como estaba. En el celular estorbaba: es
 * donde el movil es prioritario (R6) y donde mas dano hacia. Rotaba solo cada
 * seis segundos y **no se pausaba al tocar** —solo al pasar el mouse o al
 * enfocar con teclado, que en un telefono no ocurren—, asi que el mensaje
 * cambiaba bajo el dedo de quien lo estaba leyendo. Ademas el visitante cruzaba
 * el carrusel entero antes de ver un solo producto.
 *
 * Lo que queda: la foto de la primera diapositiva, quieta, y debajo lo que el
 * vecino vino a saber —de quien es esto, si esta abierto ahora y como pedir—.
 * El texto va debajo de la foto y no encima: sobre el azul de marca el
 * contraste esta garantizado, y no depende de que foto cargue el negocio desde
 * el panel.
 *
 * Es componente de servidor: no necesita estado. El unico trozo de cliente es
 * el estado de "Abierto ahora", que ya lo era.
 */
export function PortadaMovil({
  slide,
  nombre,
  eslogan,
  horario,
  whatsapp,
}: {
  slide: Slide;
  nombre: string;
  eslogan: string;
  horario: Readonly<Record<string, readonly Tramo[]>>;
  whatsapp: string | null;
}) {
  return (
    <section data-portada-movil aria-label="Presentación" className="sm:hidden">
      {slide.imagen ? (
        // `priority`: es el LCP del celular, que es la pantalla prioritaria.
        // `enfoque` (migracion 0020) dice por que altura se recorta cada foto;
        // centrarlas todas le cortaba el rotulo a la de la fachada.
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={slide.imagenMovil ?? slide.imagen}
            alt={slide.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: `50% ${slide.enfoque}%` }}
          />
        </div>
      ) : null}

      <div className="bg-primary text-primary-foreground px-4 py-8">
        <p className="font-heading text-3xl leading-tight text-balance">{nombre}</p>
        {eslogan ? (
          <p className="text-primary-foreground/85 mt-2 text-lg text-pretty">{eslogan}</p>
        ) : null}

        {/* Lo primero que se pregunta quien quiere pan: si puede ir ya. */}
        <div className="mt-4">
          <EstadoAhora horario={horario} variante="oscuro" />
        </div>

        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-cta mt-6 flex w-full justify-center"
          >
            <MessageCircle aria-hidden className="size-5" />
            Pedir por WhatsApp
          </a>
        ) : null}
      </div>
    </section>
  );
}
