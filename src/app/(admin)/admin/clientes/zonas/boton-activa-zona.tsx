"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { cambiarActivaZona } from "@/lib/acciones/zonas";

export function BotonActivaZona({
  id,
  nombre,
  activa,
}: {
  id: string;
  nombre: string;
  activa: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className="boton-linea shrink-0"
      disabled={pendiente}
      aria-label={`${activa ? "Retirar" : "Activar"} la zona ${nombre}`}
      onClick={() =>
        iniciar(async () => {
          const r = await cambiarActivaZona(id, !activa);
          if (r.estado === "ok") {
            toast.success(r.mensaje);
            router.refresh();
          }
          if (r.estado === "error") toast.error(r.mensaje);
        })
      }
    >
      {activa ? "Retirar" : "Activar"}
    </button>
  );
}
