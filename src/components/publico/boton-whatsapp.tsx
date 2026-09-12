"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/** Lo que tarda en volver desde que el cliente deja de bajar. */
const ESPERA_MS = 500;

/**
 * Boton flotante de WhatsApp (R4).
 *
 * Solo en movil: en escritorio ya esta en la cabecera, y repetirlo taparia
 * contenido sin ganar nada. El pedido por WhatsApp es como de verdad compra el
 * cliente de esta panaderia, asi que no es un adorno de esquina.
 *
 * Se aparta en dos situaciones, las dos medidas en las criticas de diseno:
 *
 * 1. Mientras hay un boton de pedir a la vista (11/09). Ahi sobra, y en el
 *    celular tapaba justo el precio y las condiciones que van a su lado. Cuenta
 *    cualquier enlace a wa.me visible, tambien el del menu desplegable: al
 *    abrirlo quedaban dos botones de pedir en la misma pantalla.
 * 2. Mientras el cliente esta bajando (12/09). Un boton fijo se come la linea
 *    que se esta leyendo: se midio encima de «Se hornea y se vende el mismo
 *    día» en el primer pliegue de la portada y del `h2` «Panes integrales» del
 *    catalogo. Vuelve al parar o al subir, que es el gesto de quien lo busca.
 *
 * Sigue siendo permanente, que es lo que pide R4: no se quita, se aparta, y
 * vuelve solo. Lo que no hace es taparle el texto a nadie.
 *
 * El estado recuerda la ruta en la que se calculo. Al cambiar de pagina deja
 * de valer por si solo y el boton reaparece, sin un `setState` sincrono dentro
 * del efecto, que es lo que prohibe `react-hooks/set-state-in-effect`.
 */
export function BotonWhatsApp({ enlace }: { enlace: string | null }) {
  const ruta = usePathname();
  const [estado, setEstado] = useState({ ruta, otroALaVista: false, bajando: false });

  useEffect(() => {
    const otros = document.querySelectorAll('a[href^="https://wa.me/"]:not([data-flotante])');
    if (otros.length === 0) return;

    const aLaVista = new Set<Element>();
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) aLaVista.add(entrada.target);
        else aLaVista.delete(entrada.target);
      }
      setEstado((previo) => ({ ...previo, ruta, otroALaVista: aLaVista.size > 0 }));
    });

    otros.forEach((boton) => observador.observe(boton));
    return () => observador.disconnect();
  }, [ruta]);

  useEffect(() => {
    let ultimo = window.scrollY;
    let temporizador = 0;
    let pendiente = false;

    // El calculo va dentro de un `requestAnimationFrame`: el evento de scroll
    // se dispara decenas de veces por segundo y leer `scrollY` en cada uno
    // fuerza al navegador a recalcular la pagina.
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;

      requestAnimationFrame(() => {
        pendiente = false;
        const ahora = window.scrollY;
        const bajando = ahora > ultimo + 8;
        const subiendo = ahora < ultimo - 8;
        if (!bajando && !subiendo) return;
        ultimo = ahora;

        setEstado((previo) => ({ ...previo, ruta, bajando }));

        window.clearTimeout(temporizador);
        if (bajando) {
          temporizador = window.setTimeout(
            () => setEstado((previo) => ({ ...previo, ruta, bajando: false })),
            ESPERA_MS,
          );
        }
      });
    };

    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.clearTimeout(temporizador);
    };
  }, [ruta]);

  if (enlace === null) return null;

  const apartado = estado.ruta === ruta && (estado.otroALaVista || estado.bajando);

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      data-flotante
      aria-hidden={apartado || undefined}
      tabIndex={apartado ? -1 : undefined}
      className={`boton-cta fixed right-4 bottom-4 z-30 rounded-full shadow-lg shadow-black/20 motion-safe:transition-[opacity,translate,background-color,color] motion-safe:duration-200 sm:hidden ${
        apartado ? "pointer-events-none translate-y-4 opacity-0" : ""
      }`}
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="font-semibold">Pedir</span>
      <span className="sr-only">por WhatsApp</span>
    </a>
  );
}
