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
        // `fetchPriority="high"` y NO `preload`.
        //
        // Esta foto y la primera del carrusel son dos candidatas a LCP segun el
        // ancho de pantalla, y la documentacion de Next 16 dice justo para ese
        // caso que no se use `preload`: inyecta un `<link rel=preload>` en el
        // `<head>` que no respeta el `display:none`, asi que el celular se
        // bajaba LAS DOS. Medido en produccion el 12/09: 41 KB de la foto del
        // celular y 32 KB de la misma foto para el carrusel que no se ve,
        // compitiendo por el ancho de banda justo mientras se mide el LCP.
        //
        // La combinacion, medida y no supuesta: `loading="eager"` porque esta
        // foto es el LCP del celular y diferirla le costaba 301 ms solo en
        // descubrirla (con `lazy` el propio Lighthouse avisa: "LCP resources
        // should not use loading=lazy"); con `eager` ese retraso baja a 21 ms.
        // Y `fetchPriority="high"` para darle la prioridad que antes daba el
        // preload. (`priority` ademas quedo deprecado en Next 16.)
        //
        // El carrusel usa el mismo `sizes="100vw"` a proposito: asi en cada
        // ancho las dos resuelven a la MISMA candidata del `srcset`, el
        // navegador la descarga una sola vez y la reaprovecha la que se vea.
        //
        // `enfoque` (migracion 0020) dice por que altura se recorta cada foto;
        // centrarlas todas le cortaba el rotulo a la de la fachada.
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={slide.imagenMovil ?? slide.imagen}
            alt={slide.alt}
            fill
            fetchPriority="high"
            loading="eager"
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
