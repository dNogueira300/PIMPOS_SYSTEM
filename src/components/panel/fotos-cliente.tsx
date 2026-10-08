"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { agregarFotoCliente, cambiarFotoCliente, quitarFotoCliente } from "@/lib/acciones/clientes";
import type { FotoCliente } from "@/lib/clientes/datos";

import { ConfirmarBorrado } from "./confirmar-borrado";
import { SubidaImagen } from "./subida-imagen";

type Props = { clienteId: string | null; fotos: FotoCliente[]; puedeQuitar: boolean };

/**
 * Hasta 3 fotos de la fachada (ficha 8.3), en el bucket PRIVADO: se ven por URL
 * firmada. Al crear no hay cliente todavía y la política de Storage (0014) exige
 * una carpeta de un cliente que exista: se pide guardar primero, como en F4.
 */
export function FotosCliente({ clienteId, fotos, puedeQuitar }: Props) {
  const router = useRouter();
  if (!clienteId) {
    return (
      <p className="bg-muted rounded-md border border-dashed p-4 text-sm" data-fotos-bloqueadas>
        <strong>Primero guarda el cliente</strong> y después podrás añadir hasta 3 fotos de la
        fachada.
      </p>
    );
  }
  const id = clienteId;
  return (
    <div className="flex flex-col gap-4">
      {fotos.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Fotos de la fachada">
          {fotos.map((f) => (
            <li key={f.id} className="bg-card flex flex-col gap-2 rounded-md border p-2">
              {f.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL firmada de un bucket privado (ver la ficha)
                <img
                  src={f.url}
                  alt={`Fachada de la casa, foto ${f.orden}`}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              ) : null}
              {/* Cambiar sobrescribe el mismo archivo: lo puede hacer también el
                  repartidor, que añade y cambia fotos pero no las borra. Solo
                  para las `.webp`, que es lo que sube el panel: el archivo
                  nuevo siempre lo es, y no se le pone otra extensión. */}
              {f.ruta.endsWith(".webp") ? (
                <SubidaImagen
                  nombre={`foto_cambio_${f.orden}`}
                  bucket="clientes"
                  inmediata
                  rutaFija={f.ruta}
                  carpeta={id}
                  rutaInicial={null}
                  etiqueta={`Cambiar la foto ${f.orden}`}
                  aceptar="image/*"
                  maximoBytes={2 * 1024 * 1024}
                  alSubir={async () => {
                    const r = await cambiarFotoCliente(f.id);
                    if (r.estado === "ok") {
                      toast.success(r.mensaje);
                      router.refresh();
                    }
                    if (r.estado === "error") toast.error(r.mensaje);
                  }}
                />
              ) : null}
              {puedeQuitar ? (
                <ConfirmarBorrado
                  nombre={`la foto ${f.orden}`}
                  aviso="La foto se borra del sistema. No se puede deshacer."
                  accion={quitarFotoCliente.bind(null, f.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {fotos.length < 3 ? (
        <SubidaImagen
          nombre="foto_nueva"
          bucket="clientes"
          inmediata
          carpeta={id}
          rutaInicial={null}
          etiqueta={`Añadir una foto de la fachada (${fotos.length} de 3)`}
          aceptar="image/*"
          maximoBytes={2 * 1024 * 1024}
          alSubir={async (ruta) => {
            const r = await agregarFotoCliente(id, ruta);
            if (r.estado === "ok") {
              toast.success(r.mensaje);
              router.refresh();
            }
            if (r.estado === "error") toast.error(r.mensaje);
          }}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Ya tiene 3 fotos.{" "}
          {puedeQuitar ? "Cambia una o quítala para añadir otra." : "Puedes cambiar cualquiera."}
        </p>
      )}
    </div>
  );
}
