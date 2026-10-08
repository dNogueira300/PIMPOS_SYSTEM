"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

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
import { CLASE_CONTROL } from "@/components/panel/campo";
import { borrarDatosCliente, borrarFotosQueQuedaron } from "@/lib/acciones/clientes";

/** Decisión 3. No es el tachito de siempre: pide motivo y no se deshace. */
export function BorrarDatosCliente({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const campo = useId();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger
        className="boton-linea text-destructive shrink-0"
        // Con su nombre: en «Para revisar» hay uno por cliente. Empieza por el
        // texto visible, para que la voz y la vista digan lo mismo.
        aria-label={`Borrar sus datos: ${nombre}`}
      >
        Borrar sus datos
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar los datos de {nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran su nombre, celular, dirección, punto en el mapa y fotos. No se puede deshacer.
            Queda solo la constancia de que se borraron, quién y por qué.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label htmlFor={campo} className="text-sm font-semibold">
          ¿Por qué? (lo pidió el cliente, por ejemplo)
        </label>
        <p id={`${campo}-ayuda`} className="text-muted-foreground text-sm">
          Sin su nombre ni su número: el motivo se guarda y no se borra.
        </p>
        <textarea
          id={campo}
          rows={2}
          className={CLASE_CONTROL}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${campo}-ayuda ${campo}-error` : `${campo}-ayuda`}
        />
        {error ? (
          <p id={`${campo}-error`} className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="boton-linea">No, dejarlo</AlertDialogCancel>
          {/* Un <button> propio y no AlertDialogAction: esa cierra el diálogo al pulsar, y con un error hay que corregir el motivo. */}
          <button
            type="button"
            className="boton-cta bg-destructive"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await borrarDatosCliente(id, motivo);
                if (r.estado === "error") {
                  setError(r.errores?.motivo?.[0] ?? r.mensaje);
                  return;
                }
                if (r.estado === "ok") {
                  setAbierto(false);
                  if (r.extra?.fotosSinBorrar) {
                    // Quedaron fotos: a la ficha, que es donde se reintenta.
                    // Desde «Para revisar» el cliente sale de la lista y el
                    // aviso se iba sin dejar camino (revisión de T5).
                    toast.warning(r.mensaje);
                    router.push(`/admin/clientes/${id}`);
                  } else {
                    toast.success(r.mensaje);
                    router.refresh();
                  }
                }
              })
            }
          >
            Sí, borrar sus datos
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Si al borrar falló Storage, las fotos siguen en su carpeta: se reintenta aquí. */
export function BorrarFotosQueQuedaron({ id, cuantas }: { id: string; cuantas: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <div role="status" className="bg-alerta/15 mt-4 flex flex-col gap-3 rounded-md p-4 text-sm">
      <p>
        {cuantas === 1
          ? "Queda 1 foto de su casa guardada en el sistema."
          : `Quedan ${cuantas} fotos de su casa guardadas en el sistema.`}{" "}
        No se pudieron borrar a la vez que sus datos.
      </p>
      <button
        type="button"
        className="boton-cta self-start"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await borrarFotosQueQuedaron(id);
            if (r.estado === "ok") {
              toast.success(r.mensaje);
              router.refresh();
            }
            if (r.estado === "error") toast.error(r.mensaje);
          })
        }
      >
        Borrar las fotos que quedaron
      </button>
    </div>
  );
}
