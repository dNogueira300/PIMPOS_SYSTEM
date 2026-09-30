"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { seguirComoCliente } from "@/lib/acciones/clientes";

/** «Sigue siendo cliente» (decisión 4): renueva la fecha y lo saca de la lista. */
export function BotonSigueCliente({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className="boton-linea shrink-0"
      disabled={pendiente}
      aria-label={`${nombre} sigue siendo cliente`}
      onClick={() =>
        iniciar(async () => {
          const r = await seguirComoCliente(id);
          if (r.estado === "ok") {
            toast.success(r.mensaje);
            router.refresh();
          }
          if (r.estado === "error") toast.error(r.mensaje);
        })
      }
    >
      Sigue siendo cliente
    </button>
  );
}
