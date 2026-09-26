"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EstadoAccion } from "@/lib/panel/accion";

import { CLASE_CONTROL } from "./campo";

/**
 * Anular pide un motivo: sin él, el kárdex tendría una línea tachada que nadie
 * sabe explicar en el próximo conteo. Nombra lo que se anula, como
 * `ConfirmarBorrado`.
 */
export function AnularMovimiento({
  descripcion,
  accion,
}: {
  /** «el consumo del 12/10/2026 08:00 (5 kg)» */
  descripcion: string;
  accion: (fd: FormData) => Promise<EstadoAccion>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    iniciar(async () => {
      const r = await accion(datos);
      if (r.estado === "ok") {
        setAbierto(false);
        router.refresh();
      } else if (r.estado === "error") {
        setError(r.mensaje);
      }
    });
  }

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="boton-linea size-12 p-0"
          aria-label={`Anular ${descripcion}`}
        >
          <Undo2 aria-hidden className="size-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular {descripcion}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registra el movimiento contrario y el original queda tachado. No se borra nada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1 text-sm">
            <span>Motivo</span>
            <textarea name="motivo" rows={2} required className={CLASE_CONTROL} />
          </label>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="boton-linea">Cancelar</AlertDialogCancel>
            <button type="submit" className="boton-cta" disabled={pendiente}>
              {pendiente ? "Anulando…" : "Anular"}
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
