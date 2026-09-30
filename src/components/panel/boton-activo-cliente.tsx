"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { cambiarActivoCliente } from "@/lib/acciones/clientes";

export function BotonActivoCliente({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className="boton-linea"
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          const r = await cambiarActivoCliente(id, !activo);
          if (r.estado === "ok") {
            toast.success(r.mensaje);
            router.refresh();
          }
          if (r.estado === "error") toast.error(r.mensaje);
        })
      }
    >
      {activo ? "Desactivar" : "Reactivar"}
    </button>
  );
}
