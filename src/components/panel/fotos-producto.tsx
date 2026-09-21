"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  agregarFotoProducto,
  cambiarTextoFoto,
  listarFotosSueltas,
  marcarFotoPrincipal,
  quitarFotoProducto,
} from "@/lib/acciones/productos";
import type { EstadoAccion } from "@/lib/panel/accion";
import { urlDeImagen } from "@/lib/supabase/publico";

import { CLASE_CONTROL } from "./campo";
import { ConfirmarBorrado } from "./confirmar-borrado";
import { SubidaImagen } from "./subida-imagen";

export type FotoProducto = { id: string; ruta: string; alt: string | null; es_principal: boolean };

type Props = { productoId: string | null; nombreProducto: string; fotos: FotoProducto[] };

/**
 * Al crear, el producto aún no tiene id y cada foto es una fila que lo exige:
 * se pide guardar primero (decisión 10). Al editar, cada foto se sube y se
 * guarda en el momento, sin esperar a «Guardar».
 */
export function FotosProducto({ productoId, nombreProducto, fotos }: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [sueltas, setSueltas] = useState<string[] | null>(null);

  if (!productoId) {
    return (
      <p className="bg-muted rounded-xl border border-dashed p-4 text-sm" data-fotos-bloqueadas>
        <strong>Primero guarda el producto</strong> y después podrás añadirle fotos.
      </p>
    );
  }

  const id = productoId;

  function avisar(resultado: EstadoAccion) {
    if (resultado.estado === "ok") {
      toast.success(resultado.mensaje);
      router.refresh();
    }
    if (resultado.estado === "error") toast.error(resultado.mensaje);
  }

  const alt = `${nombreProducto} de Panadería Pimpo's`;

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {fotos.map((foto) => (
          <li
            key={foto.id}
            className="bg-card flex flex-col gap-2 rounded-xl border p-3"
            data-foto={foto.id}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel; ver SubidaImagen */}
            <img
              src={urlDeImagen("productos", foto.ruta) ?? ""}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Texto para quien no ve la foto
              <input
                className={CLASE_CONTROL}
                defaultValue={foto.alt ?? ""}
                onBlur={(e) => {
                  const nuevo = e.currentTarget.value;
                  if (nuevo !== (foto.alt ?? ""))
                    iniciar(async () => avisar(await cambiarTextoFoto(foto.id, nuevo)));
                }}
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              {foto.es_principal ? (
                <span className="text-sm font-semibold">
                  <Star aria-hidden className="inline size-4" /> Principal
                </span>
              ) : (
                <button
                  type="button"
                  className="boton-linea"
                  disabled={pendiente}
                  onClick={() =>
                    iniciar(async () => avisar(await marcarFotoPrincipal(id, foto.id)))
                  }
                >
                  Hacer principal
                </button>
              )}
              <ConfirmarBorrado
                nombre="esta foto"
                accion={quitarFotoProducto.bind(null, foto.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      <SubidaImagen
        nombre="foto_nueva"
        bucket="productos"
        carpeta={`productos/${id}`}
        rutaInicial={null}
        etiqueta="Añadir una foto"
        alSubir={async (ruta) => avisar(await agregarFotoProducto(id, ruta, alt))}
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="boton-linea w-fit"
          onClick={() => iniciar(async () => setSueltas(await listarFotosSueltas()))}
        >
          Elegir entre las fotos ya subidas
        </button>
        {sueltas !== null ? (
          sueltas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay fotos sin asignar.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2" aria-label="Fotos sin asignar">
              {sueltas.map((ruta) => (
                <li key={ruta}>
                  <button
                    type="button"
                    className="block w-full overflow-hidden rounded-lg border"
                    aria-label={`Asignar ${ruta}`}
                    onClick={() =>
                      iniciar(async () => {
                        avisar(await agregarFotoProducto(id, ruta, alt));
                        setSueltas(null);
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                    <img
                      src={urlDeImagen("productos", ruta) ?? ""}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
