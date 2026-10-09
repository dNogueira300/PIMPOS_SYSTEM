"use client";

import { useEffect, useRef } from "react";

/** Decoración: el observador solo inicia una pasada de CSS al entrar en pantalla. */
export function MotoDelivery() {
  const pista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = pista.current;
    if (
      !elemento ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          elemento.dataset.recorrido = "iniciado";
          observador.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={pista} data-recorrido-delivery aria-hidden="true" className="recorrido-delivery mt-6">
      <div data-moto-delivery className="moto-delivery">
        <svg viewBox="0 0 164 112" fill="none" focusable="false">
          {/* Silueta vectorial inspirada en la referencia de moto de reparto de Dan. */}
          <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="36" cy="86" r="21" />
            <circle cx="134" cy="86" r="21" />
            <path d="M36 86 57 57h48l29 29M104 49h13l17 37M50 96h42q14 0 17-17" />
            <path d="M15 62h42M113 67q20-19 42 0" />
          </g>
          <path
            fill="currentColor"
            d="M10 33h34a4 4 0 0 1 4 4v23H10a4 4 0 0 1-4-4V37a4 4 0 0 1 4-4Z"
          />
          <path
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            d="M2 41h13M1 49h10M3 57h10"
          />
          <circle cx="78" cy="23" r="11" fill="currentColor" />
          <path stroke="currentColor" strokeWidth="7" strokeLinecap="round" d="M65 18h30" />
          <path
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m74 42-13 23 36 12-7 23"
          />
          <path
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m75 43 20 15h17"
          />
          <path fill="currentColor" d="M111 48h11v13h-11z" />
        </svg>
      </div>
    </div>
  );
}
