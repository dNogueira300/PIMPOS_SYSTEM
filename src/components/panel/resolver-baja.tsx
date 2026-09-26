"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

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

export function ResolverBaja({
  descripcion,
  aprobar,
  rechazar,
}: {
  /** «5 kg de Azúcar» */
  descripcion: string;
  aprobar: () => Promise<EstadoAccion>;
  rechazar: (fd: FormData) => Promise<EstadoAccion>;
}) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  const ejecutar = (paso: () => Promise<EstadoAccion>) =>
    iniciar(async () => {
      const r = await paso();
      if (r.estado === "ok") {
        setAbierto(false);
        router.refresh();
      } else if (r.estado === "error") {
        setMensaje(r.mensaje);
      }
    });

  function enviarRechazo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    ejecutar(() => rechazar(datos));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="boton-cta"
          disabled={pendiente}
          onClick={() => ejecutar(aprobar)}
          aria-label={`Aprobar la baja de ${descripcion}`}
        >
          <Check aria-hidden className="size-5" /> Aprobar
        </button>
        <AlertDialog open={abierto} onOpenChange={setAbierto}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="boton-linea"
              aria-label={`Rechazar la baja de ${descripcion}`}
            >
              <X aria-hidden className="size-5" /> Rechazar
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={enviarRechazo} className="flex flex-col gap-4">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar la baja de {descripcion}?</AlertDialogTitle>
                <AlertDialogDescription>
                  No se descuenta nada. Quien la pidió verá tu comentario.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex flex-col gap-1 text-sm">
                <span>Comentario</span>
                <textarea name="comentario" rows={2} required className={CLASE_CONTROL} />
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel className="boton-linea">Cancelar</AlertDialogCancel>
                <button type="submit" className="boton-cta" disabled={pendiente}>
                  Rechazar
                </button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {mensaje ? (
        <p role="alert" className="text-destructive text-sm">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
