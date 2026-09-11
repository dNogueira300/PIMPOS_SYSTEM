"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/**
 * Boton flotante de WhatsApp (R4).
 *
 * Solo en movil: en escritorio ya esta en la cabecera, y repetirlo taparia
 * contenido sin ganar nada. El pedido por WhatsApp es como de verdad compra el
 * cliente de esta panaderia, asi que no es un adorno de esquina.
 *
 * Se aparta mientras el boton de pedir de la propia pagina esta a la vista
 * (critica del 11/09, P2): en ese momento sobra, y en el celular tapaba justo
 * el precio y las condiciones que van al lado de ese boton. En cuanto ese boton
 * sale de la pantalla, vuelve.
 *
 * El estado recuerda la ruta en la que se calculo. Al cambiar de pagina deja
 * de valer por si solo y el boton reaparece, sin un `setState` sincrono dentro
 * del efecto, que es lo que prohibe `react-hooks/set-state-in-effect`.
 */
export function BotonWhatsApp({ enlace }: { enlace: string | null }) {
  const ruta = usePathname();
  const [estado, setEstado] = useState({ ruta, propioALaVista: false });

  useEffect(() => {
    const propios = document.querySelectorAll('main a.boton-cta[href^="https://wa.me/"]');
    if (propios.length === 0) return;

    const aLaVista = new Set<Element>();
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) aLaVista.add(entrada.target);
        else aLaVista.delete(entrada.target);
      }
      setEstado({ ruta, propioALaVista: aLaVista.size > 0 });
    });

    propios.forEach((boton) => observador.observe(boton));
    return () => observador.disconnect();
  }, [ruta]);

  if (enlace === null) return null;

  const apartado = estado.ruta === ruta && estado.propioALaVista;

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
