"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import type { EstadoAccion } from "@/lib/panel/accion";

type Props = {
  nombre: string;
  subir: () => Promise<EstadoAccion>;
  bajar: () => Promise<EstadoAccion>;
  primero: boolean;
  ultimo: boolean;
};

/** Sube o baja una fila un puesto. La lista se actualiza sola: `updateTag`
 * dentro de la acción invalida también el render del panel que la pidió, y
 * Next vuelve a pintar la página tras la Server Action. */
export function BotonesOrden({ nombre, subir, bajar, primero, ultimo }: Props) {
  const [pendiente, iniciar] = useTransition();
  const ejecutar = (accion: () => Promise<EstadoAccion>) =>
    iniciar(async () => {
      const r = await accion();
      if (r.estado === "ok") toast.success(r.mensaje);
      if (r.estado === "error") toast.error(r.mensaje);
    });

  return (
    <>
      <button
        type="button"
        className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-full disabled:opacity-40"
        aria-label={`Subir ${nombre}`}
        disabled={primero || pendiente}
        onClick={() => ejecutar(subir)}
      >
        <ArrowUp aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-full disabled:opacity-40"
        aria-label={`Bajar ${nombre}`}
        disabled={ultimo || pendiente}
        onClick={() => ejecutar(bajar)}
      >
        <ArrowDown aria-hidden className="size-5" />
      </button>
    </>
  );
}
