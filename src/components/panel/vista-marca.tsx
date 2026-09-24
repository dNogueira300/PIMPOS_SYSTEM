"use client";

import { useSyncExternalStore } from "react";

import { urlDeImagen } from "@/lib/supabase/publico";

function campoDe(nombreCampo: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[type=hidden][name="${nombreCampo}"]`);
}

/**
 * `SubidaImagen` cambia el campo oculto por código (al terminar de subir) y
 * dispara un evento `input` a mano para avisar; leerlo con
 * `useSyncExternalStore` evita poner estado dentro de un efecto
 * (`react-hooks/set-state-in-effect`) y no depende de que este componente sea
 * hijo de `SubidaImagen`: solo necesita el `name` del campo.
 */
function suscribir(nombreCampo: string, avisar: () => void): () => void {
  const formulario = campoDe(nombreCampo)?.form;
  formulario?.addEventListener("input", avisar);
  return () => formulario?.removeEventListener("input", avisar);
}

/**
 * Vista previa del favicon a los tamaños en que se ve de verdad (doc 03 §5.5),
 * sobre crema y sobre azul: un favicon que no se lee a 16 px no sirve.
 * Lee la ruta del campo oculto que deja `SubidaImagen`.
 */
export function VistaFavicon({ nombreCampo }: { nombreCampo: string }) {
  const ruta = useSyncExternalStore(
    (avisar) => suscribir(nombreCampo, avisar),
    () => campoDe(nombreCampo)?.value ?? null,
    () => null,
  );

  const url = urlDeImagen("marca", ruta);
  if (!url) return null;

  return (
    <div className="flex flex-wrap gap-4" aria-label="Así se verá el icono de la pestaña">
      {["bg-background", "bg-primary"].map((fondo) => (
        <div key={fondo} className={`${fondo} flex items-end gap-3 rounded-xl border p-3`}>
          {[16, 32, 180].map((lado) => (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa a tamaño exacto; next/image la reescalaría
            <img
              key={lado}
              src={url}
              alt=""
              width={lado}
              height={lado}
              style={{ width: lado, height: lado }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
