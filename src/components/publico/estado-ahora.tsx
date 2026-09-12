"use client";

import { useSyncExternalStore } from "react";

import type { Tramo } from "@/lib/datos/configuracion";
import { estadoDelHorario } from "@/lib/datos/horario";

/**
 * "Abierto ahora · Hasta la 1:00 p. m."
 *
 * P2 de la critica del 12/09: en ningun sitio se decia si la panaderia esta
 * abierta en este momento. El horario lo dice, pero obliga a leer dos turnos y
 * mirar el reloj; con apertura a las 4 de la madrugada y cierre al mediodia,
 * esa cuenta la hace mal cualquiera.
 *
 * Es de cliente por fuerza: depende de que hora es. El sitio se prerenderiza
 * con Cache Components, asi que un calculo en el servidor quedaria congelado en
 * el momento del build —"Abierto ahora" a las tres de la madrugada— y ademas un
 * `new Date()` suelto tira el prerenderizado.
 *
 * `useSyncExternalStore` y no un efecto con `setState`: es la herramienta para
 * un valor que vive fuera de React y cambia solo. Su version de servidor
 * devuelve `null`, asi que el HTML prerenderizado no lleva nada y no hay
 * desajuste al hidratar; y no choca con `react-hooks/set-state-in-effect`.
 */

const CADA_MEDIO_MINUTO = 30_000;

function suscribir(avisar: () => void) {
  const reloj = window.setInterval(avisar, CADA_MEDIO_MINUTO);
  return () => window.clearInterval(reloj);
}

// El minuto, no el milisegundo: el snapshot tiene que ser el mismo entre dos
// renderizados seguidos o React vuelve a pintar sin parar.
const minutoActual = () => Math.floor(Date.now() / 60_000);
const sinReloj = () => null;

export function EstadoAhora({
  horario,
  variante = "claro",
}: {
  horario: Readonly<Record<string, readonly Tramo[]>>;
  /** `oscuro` para el pie, que va sobre el azul institucional. */
  variante?: "claro" | "oscuro";
}) {
  const minuto = useSyncExternalStore(suscribir, minutoActual, sinReloj);

  // En el servidor y en el primer renderizado todavia no hay reloj.
  if (minuto === null) return null;

  const estado = estadoDelHorario(horario, new Date(minuto * 60_000));
  if (estado === null) return null;

  const apagado = variante === "oscuro" ? "text-primary-foreground/70" : "text-muted-foreground";
  // El dorado no se lee sobre el azul del pie; ahi el punto va del color del
  // propio texto. Cerrado se apaga en las dos variantes.
  const punto = !estado.abierto
    ? "bg-current opacity-40"
    : variante === "oscuro"
      ? "bg-primary-foreground"
      : "bg-acento";

  return (
    <p
      data-estado={estado.abierto ? "abierto" : "cerrado"}
      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
    >
      <span className="flex items-center gap-2 font-medium">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${punto}`} />
        {estado.etiqueta}
      </span>
      <span className={apagado}>{estado.detalle}</span>
    </p>
  );
}
