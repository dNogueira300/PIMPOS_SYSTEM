import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  /** A dónde vuelve «‹». En el celular sustituye a las migas. */
  volver?: { ruta: string; nombre: string };
  /** La acción principal de la pantalla, visible sin bajar. */
  accion?: ReactNode;
  descripcion?: string;
};

export function EncabezadoPanel({ titulo, volver, accion, descripcion }: Props) {
  return (
    <header className="mb-5 flex flex-col gap-2">
      {volver ? (
        <Link
          href={volver.ruta}
          className="text-muted-foreground inline-flex min-h-11 w-fit items-center gap-1 text-sm"
        >
          <ChevronLeft aria-hidden className="size-4" /> {volver.nombre}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-primary text-2xl md:text-3xl">{titulo}</h1>
        {accion}
      </div>
      {descripcion ? (
        <p className="text-muted-foreground max-w-prose text-sm">{descripcion}</p>
      ) : null}
    </header>
  );
}
