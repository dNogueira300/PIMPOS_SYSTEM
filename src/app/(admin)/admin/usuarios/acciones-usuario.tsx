"use client";

import { KeyRound, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { cambiarActivo, eliminarUsuario, restablecerClave } from "@/lib/acciones/usuarios";

import { ClaveTemporal } from "./clave-temporal";

type Props = {
  id: string;
  nombre: string;
  activo: boolean;
  esYo: boolean;
  /** false si quien mira es administrador y la cuenta es de un superadmin (0029). */
  puedeGestionar: boolean;
  puedeEliminar: boolean;
};

/**
 * Los botones ocultos son comodidad: si alguien llamara a la acción a mano,
 * la acción, la RLS y el trigger de 0029 dirían que no igual.
 */
export function AccionesUsuario({
  id,
  nombre,
  activo,
  esYo,
  puedeGestionar,
  puedeEliminar,
}: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [nueva, setNueva] = useState<{ correo: string; clave: string } | null>(null);

  if (esYo) {
    return (
      <section
        aria-label="Acceso de tu cuenta"
        className="bg-card mt-4 flex flex-col gap-2 rounded-xl border p-4"
      >
        <p className="text-muted-foreground text-sm">
          Esta es tu cuenta: tu rol y tu acceso los cambia otro administrador.
        </p>
        <Link href="/cambiar-clave" className="boton-linea w-fit">
          <KeyRound aria-hidden className="size-5" /> Cambiar mi contraseña
        </Link>
      </section>
    );
  }
  if (!puedeGestionar) {
    return (
      <p className="text-muted-foreground mt-4 text-sm">
        Solo el super administrador cambia el acceso de esta cuenta.
      </p>
    );
  }
  if (nueva) return <ClaveTemporal correo={nueva.correo} clave={nueva.clave} />;

  return (
    <section
      aria-labelledby="acceso-titulo"
      className="bg-card mt-4 flex flex-col gap-2 rounded-xl border p-4"
    >
      <h2 id="acceso-titulo" className="font-semibold">
        Acceso
      </h2>
      <button
        type="button"
        className="boton-linea"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await cambiarActivo(id, !activo);
            if (r.estado === "ok") {
              toast.success(r.mensaje);
              router.refresh();
            }
            if (r.estado === "error") toast.error(r.mensaje);
          })
        }
      >
        {activo ? (
          <UserX aria-hidden className="size-5" />
        ) : (
          <UserCheck aria-hidden className="size-5" />
        )}
        {activo ? "Desactivar la cuenta" : "Reactivar la cuenta"}
      </button>
      <button
        type="button"
        className="boton-linea"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await restablecerClave(id);
            if (r.estado === "ok" && r.extra?.clave)
              setNueva({ correo: r.extra.correo ?? "", clave: r.extra.clave });
            if (r.estado === "error") toast.error(r.mensaje);
          })
        }
      >
        <KeyRound aria-hidden className="size-5" /> Darle una contraseña temporal nueva
      </button>
      {puedeEliminar ? (
        <div className="flex items-center gap-2">
          <ConfirmarBorrado
            nombre={`la cuenta de ${nombre}`}
            aviso="Ya no podrá entrar al panel y dejará de verse en esta lista. Lo que cambió en el panel sigue a su nombre en el historial."
            accion={async () => {
              const r = await eliminarUsuario(id);
              if (r.estado === "ok") router.push("/admin/usuarios");
              return r;
            }}
          />
          <span className="text-sm">Eliminar la cuenta</span>
        </div>
      ) : null}
    </section>
  );
}
