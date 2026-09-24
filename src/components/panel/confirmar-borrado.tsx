"use client";

import { Trash } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EstadoAccion } from "@/lib/panel/accion";

type Props = {
  /** Lo que se borra, con su nombre real: «el producto Pan francés». */
  nombre: string;
  accion: () => Promise<EstadoAccion>;
  /** Qué pasa al borrar, si no es lo de siempre (una cuenta no «se ve en el sitio»). */
  aviso?: string;
};

// Sin promesa de «recuperarlo»: el panel no tiene papelera (lo borrado solo se
// recupera desde la base, a mano).
const AVISO =
  "Dejará de verse en el sitio y en el panel. Si te equivocas, pide ayuda al encargado del sistema antes de volver a cargarlo.";

export function ConfirmarBorrado({ nombre, accion, aviso = AVISO }: Props) {
  const [pendiente, iniciar] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="text-destructive hover:bg-destructive/10 inline-flex size-11 items-center justify-center rounded-full"
        aria-label={`Borrar ${nombre}`}
      >
        <Trash aria-hidden className="size-5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar {nombre}?</AlertDialogTitle>
          <AlertDialogDescription>{aviso}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="boton-linea">No, dejarlo</AlertDialogCancel>
          <AlertDialogAction
            className="boton-cta bg-destructive"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const resultado = await accion();
                if (resultado.estado === "ok") toast.success(resultado.mensaje);
                if (resultado.estado === "error") toast.error(resultado.mensaje);
              })
            }
          >
            Sí, borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
