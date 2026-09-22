"use client";

import { ArrowDown, ArrowUp, Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NOMBRE_DE_UNIDAD, UNIDADES_DE_VENTA } from "@/lib/validaciones/producto";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

export type Presentacion = {
  id: string | null;
  nombre: string;
  precio: string;
  unidad_venta: string;
};

type Fila = Presentacion & { clave: string };

const nuevaFila = (): Fila => ({
  clave: crypto.randomUUID(),
  id: null,
  nombre: "",
  precio: "",
  unidad_venta: "unidad",
});

/**
 * Las presentaciones viajan en un solo campo oculto con JSON: son una lista
 * que cambia de largo, y un formulario nativo no sabe mandar eso. La copia
 * local lo restaura por `registrarRestaurable`.
 */
export function EditorPresentaciones({ iniciales }: { iniciales: Presentacion[] }) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales.length > 0
      ? iniciales.map((p) => ({ ...p, clave: p.id ?? crypto.randomUUID() }))
      : [nuevaFila()],
  );

  useEffect(
    () =>
      registrarRestaurable("presentaciones", (valor) => {
        try {
          const lista = JSON.parse(valor) as Presentacion[];
          setFilas(lista.map((p) => ({ ...p, clave: p.id ?? crypto.randomUUID() })));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(nuevas: Fila[]) {
    setFilas(nuevas);
    // Ver SubidaImagen: se avisa a la copia local cuando React ya pintó.
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const actualizar = (clave: string, campo: keyof Presentacion, valor: string) =>
    cambiar(filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const mover = (indice: number, hacia: -1 | 1) => {
    const destino = indice + hacia;
    if (destino < 0 || destino >= filas.length) return;
    const copia = [...filas];
    [copia[indice], copia[destino]] = [copia[destino]!, copia[indice]!];
    cambiar(copia);
  };

  // Sin desestructurar `clave` a una variable sin usar: `no-unused-vars` la marcaría.
  const valor = JSON.stringify(
    filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      precio: f.precio,
      unidad_venta: f.unidad_venta,
    })),
  );
  const mensajes = errores.presentaciones ?? [];

  return (
    <div className="flex flex-col gap-3">
      <input ref={oculto} type="hidden" name="presentaciones" value={valor} />
      <p className="text-muted-foreground text-sm">
        La primera es la que se muestra primero en el sitio. Cada cambio de precio queda en el
        historial con su fecha.
      </p>

      <ol className="flex flex-col gap-3">
        {filas.map((fila, i) => (
          <li
            key={fila.clave}
            className="bg-muted/40 flex flex-col gap-2 rounded-xl p-3"
            data-presentacion={i}
          >
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Presentación {i + 1}
                <input
                  className={CLASE_CONTROL}
                  value={fila.nombre}
                  onChange={(e) => actualizar(fila.clave, "nombre", e.currentTarget.value)}
                  placeholder="Unidad"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Precio (S/)
                <input
                  className={CLASE_CONTROL}
                  inputMode="decimal"
                  value={fila.precio}
                  onChange={(e) => actualizar(fila.clave, "precio", e.currentTarget.value)}
                  placeholder="0.40"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
                Se vende por
                <select
                  className={CLASE_CONTROL}
                  value={fila.unidad_venta}
                  onChange={(e) => actualizar(fila.clave, "unidad_venta", e.currentTarget.value)}
                >
                  {UNIDADES_DE_VENTA.map((u) => (
                    <option key={u} value={u}>
                      {NOMBRE_DE_UNIDAD[u]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="boton-linea size-11 p-0"
                aria-label={`Subir la presentación ${i + 1}`}
                onClick={() => mover(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="boton-linea size-11 p-0"
                aria-label={`Bajar la presentación ${i + 1}`}
                onClick={() => mover(i, 1)}
                disabled={i === filas.length - 1}
              >
                <ArrowDown aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="text-destructive inline-flex size-11 items-center justify-center rounded-full"
                aria-label={`Quitar la presentación ${i + 1}`}
                onClick={() => cambiar(filas.filter((f) => f.clave !== fila.clave))}
                disabled={filas.length === 1}
              >
                <Trash aria-hidden className="size-5" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {mensajes.length > 0 ? (
        <ul className="text-destructive text-sm font-semibold" data-errores="presentaciones">
          {[...new Set(mensajes)].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="boton-linea"
        onClick={() => cambiar([...filas, nuevaFila()])}
      >
        <Plus aria-hidden className="size-5" /> Otra presentación
      </button>
    </div>
  );
}
