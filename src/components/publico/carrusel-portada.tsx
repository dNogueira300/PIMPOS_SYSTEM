"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Slide } from "@/lib/datos/contenido";

const INTERVALO_MS = 6000;

/**
 * Un enlace a otra web —WhatsApp, sobre todo— se abre aparte y con `<a>`:
 * `Link` es para navegar dentro del sitio, y el slide del delivery lleva
 * directo al chat.
 */
function esExterno(enlace: string): boolean {
  return /^https?:\/\//.test(enlace);
}

/**
 * Carrusel de portada (R2).
 *
 * Tres reglas que no son decorativas y que el plan (doc 03 §4.3) exige:
 *
 * 1. Se detiene al pasar el mouse o al enfocar con teclado. Un carrusel que
 *    cambia mientras alguien lee el slide es una trampa, no una animacion.
 * 2. Respeta `prefers-reduced-motion`: quien lo pide no ve avance automatico.
 * 3. El avance automatico se anuncia como region "polite" y los slides ocultos
 *    quedan fuera del arbol de accesibilidad, para que el lector de pantalla no
 *    lea cuatro titulares seguidos.
 *
 * La primera imagen lleva `fetchPriority="high"` y NO `preload`: en el celular
 * este carrusel no se ve, y un preload se descarga igual. El detalle, donde se
 * escribe la imagen.
 */
export function CarruselPortada({ slides }: { slides: Slide[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [actual, setActual] = useState(0);
  const [enPausa, setEnPausa] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const alCambiar = () => setActual(embla.selectedScrollSnap());
    alCambiar();
    embla.on("select", alCambiar);
    return () => {
      embla.off("select", alCambiar);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla || enPausa || slides.length < 2) return;

    // Se consulta aqui y no en el render: en el servidor no existe matchMedia,
    // y el valor puede cambiar mientras la pagina esta abierta.
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (sinMovimiento.matches) return;

    // En el celular el carrusel esta oculto, pero el componente se monta igual:
    // sin esto, un temporizador avanzaria diapositivas cada seis segundos para
    // nadie. El umbral es el mismo `sm` de Tailwind con el que se oculta.
    if (!window.matchMedia("(min-width: 640px)").matches) return;

    const temporizador = window.setInterval(() => embla.scrollNext(), INTERVALO_MS);
    return () => window.clearInterval(temporizador);
  }, [embla, enPausa, slides.length]);

  const irA = useCallback((indice: number) => embla?.scrollTo(indice), [embla]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Novedades de la panadería"
      className="relative"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
      onFocusCapture={() => setEnPausa(true)}
      onBlurCapture={() => setEnPausa(false)}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, indice) => (
            <div
              key={slide.id}
              className="relative min-w-0 shrink-0 grow-0 basis-full"
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${indice + 1} de ${slides.length}`}
              aria-hidden={indice !== actual}
            >
              {/* `enfoque` (0020) dice por que altura se recorta cada foto. En
                  escritorio el carrusel es panoramico y las fotos del negocio
                  son verticales: centrada, la de la fachada perdia el rotulo.
                  Es un dato de la diapositiva y no un valor fijo porque cada
                  foto lo necesita distinto. */}
              {/* Una sola imagen, la de escritorio: desde el 12/09 el carrusel
                  no se ve en el celular —ahi va `PortadaMovil`—, asi que la
                  variante movil sobraba y encima se descargaba.

                  Sin `preload` (ni el `priority` que Next 16 deprecó), y con la
                  carga diferida por defecto. El truco anterior —`sizes` con
                  `1px` por debajo de 640— no llegaba a funcionar: el preload
                  ignora el `display:none`, y con `1px` el navegador no dejaba
                  de pedir la foto, solo elegia la candidata mas pequena del
                  `srcset`, que son 640w y 32 KB. En produccion el celular se
                  bajaba esta foto ademas de la suya, la misma dos veces.

                  Diferida, el navegador no pide lo que no se ve; en escritorio,
                  que es donde este carrusel existe, `fetchPriority` le da la
                  prioridad de LCP que antes daba el preload. */}
              <div className="relative aspect-[21/9] w-full">
                {slide.imagen ? (
                  <Image
                    src={slide.imagen}
                    alt={slide.alt}
                    fill
                    fetchPriority={indice === 0 ? "high" : undefined}
                    sizes="100vw"
                    className="object-cover"
                    style={{ objectPosition: `50% ${slide.enfoque}%` }}
                  />
                ) : null}

                {/* Velo crema desde la izquierda con el titular en azul (prototipo
                    de Stitch, plan 03.1). Sustituye al degradado oscuro de F3.
                    Por qué su zona opaca no es un porcentaje fijo, en la clase
                    `.velo-hero` de globals.css. */}
                <div className="velo-hero absolute inset-0" />

                <div className="absolute inset-0 flex items-center">
                  {/* `data-texto-hero`: la prueba mide que este bloque caiga
                      entero dentro de la zona opaca del velo. */}
                  <div className="mx-auto w-full max-w-(--container-contenido) px-4 pb-10 sm:px-6">
                    <div data-texto-hero className="max-w-xl">
                      <h2 className="font-heading text-primary text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-balance lg:text-5xl">
                        {slide.titulo}
                      </h2>
                      {slide.subtitulo ? (
                        <p className="text-muted-foreground mt-4 text-base text-pretty sm:text-lg">
                          {slide.subtitulo}
                        </p>
                      ) : null}
                      {slide.enlace && esExterno(slide.enlace) ? (
                        <a
                          href={slide.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={indice === actual ? undefined : -1}
                          className="boton-cta mt-6"
                        >
                          {slide.textoBoton ?? "Ver más"}
                        </a>
                      ) : slide.enlace ? (
                        <Link
                          href={slide.enlace}
                          tabIndex={indice === actual ? undefined : -1}
                          className="boton-cta mt-6"
                        >
                          {slide.textoBoton ?? "Ver más"}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          {/* Las flechas van abajo a la derecha, como en el prototipo, y no
              centradas en los bordes: con el texto a la izquierda sobre el
              velo, a 768 y 1024 px la flecha izquierda tapaba el comienzo del
              titular y el subtítulo (a esos anchos el contenedor casi no tiene
              margen). Lo vigila e2e/portada.spec.ts. */}
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            className="focus-visible:outline-ring size-tactil bg-background text-primary shadow-suave hover:bg-muted absolute right-[4.25rem] bottom-2 hidden items-center justify-center rounded-full transition-colors focus-visible:outline-2 sm:flex"
          >
            <ChevronLeft aria-hidden className="size-6" />
            <span className="sr-only">Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            className="focus-visible:outline-ring size-tactil bg-background text-primary shadow-suave hover:bg-muted absolute right-4 bottom-2 hidden items-center justify-center rounded-full transition-colors focus-visible:outline-2 sm:flex"
          >
            <ChevronRight aria-hidden className="size-6" />
            <span className="sr-only">Siguiente</span>
          </button>

          {/* Cada punto es un boton de 44 px aunque la raya que se ve mida 12:
              el area tactil minima (R15) es la del dedo, no la del dibujo. */}
          <div className="bg-background/85 absolute bottom-2 left-1/2 flex -translate-x-1/2 justify-center gap-0.5 rounded-full px-2">
            {slides.map((slide, indice) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => irA(indice)}
                aria-current={indice === actual}
                className="focus-visible:outline-ring size-tactil flex items-center justify-center focus-visible:outline-2"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    indice === actual ? "bg-primary w-6" : "bg-primary/30 w-3"
                  }`}
                />
                <span className="sr-only">Ir a la diapositiva {indice + 1}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
