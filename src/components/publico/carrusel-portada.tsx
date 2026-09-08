"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Slide } from "@/lib/datos/contenido";

const INTERVALO_MS = 6000;

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
 * La primera imagen lleva `priority`: es el LCP de la portada.
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
              <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]">
                {slide.imagen ? (
                  <Image
                    src={slide.imagenMovil ?? slide.imagen}
                    alt={slide.alt}
                    fill
                    priority={indice === 0}
                    sizes="(max-width: 640px) 100vw, 100vw"
                    className="object-cover sm:hidden"
                  />
                ) : null}
                {slide.imagen ? (
                  <Image
                    src={slide.imagen}
                    alt={slide.alt}
                    fill
                    priority={indice === 0}
                    sizes="100vw"
                    className="hidden object-cover sm:block"
                  />
                ) : null}

                {/* Degradado desde la tinta de marca, no negro puro: el texto
                    tiene que leerse sobre cualquier foto sin que la foto se
                    apague del todo. */}
                <div className="absolute inset-0 bg-linear-to-t from-[#231a14]/85 via-[#231a14]/40 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                  <div className="mx-auto w-full max-w-(--container-contenido) px-4 pb-10 sm:px-6 sm:pb-16">
                    <div className="max-w-xl">
                      <h2 className="font-heading text-3xl leading-tight text-balance text-[#fdf9f3] sm:text-5xl">
                        {slide.titulo}
                      </h2>
                      {slide.subtitulo ? (
                        <p className="mt-3 text-base text-pretty text-[#fdf9f3]/90 sm:text-lg">
                          {slide.subtitulo}
                        </p>
                      ) : null}
                      {slide.enlace ? (
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
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            className="focus-visible:outline-ring size-tactil absolute top-1/2 left-2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-[#fdf9f3]/85 text-[#231a14] transition-colors hover:bg-[#fdf9f3] focus-visible:outline-2 sm:flex"
          >
            <ChevronLeft aria-hidden className="size-6" />
            <span className="sr-only">Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            className="focus-visible:outline-ring size-tactil absolute top-1/2 right-2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-[#fdf9f3]/85 text-[#231a14] transition-colors hover:bg-[#fdf9f3] focus-visible:outline-2 sm:flex"
          >
            <ChevronRight aria-hidden className="size-6" />
            <span className="sr-only">Siguiente</span>
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((slide, indice) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => irA(indice)}
                aria-current={indice === actual}
                className="focus-visible:outline-ring flex h-8 w-8 items-center justify-center focus-visible:outline-2"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    indice === actual ? "w-6 bg-[#fdf9f3]" : "w-3 bg-[#fdf9f3]/50"
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
