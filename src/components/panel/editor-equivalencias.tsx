"use client";

import { Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

export type UnidadOpcion = { id: string; codigo: string; nombre: string };
export type Equivalencia = { unidad_desde_id: string; factor: string };
type Fila = Equivalencia & { clave: string };

const nueva = (): Fila => ({ clave: crypto.randomUUID(), unidad_desde_id: "", factor: "" });

/**
 * «1 saco = 50 kg», una fila por unidad de compra. Viaja en un campo oculto
 * con JSON, como las presentaciones de un producto (F4).
 */
export function EditorEquivalencias({
  iniciales,
  unidades,
  unidadBase,
}: {
  iniciales: Equivalencia[];
  unidades: UnidadOpcion[];
  /** El código de la unidad en la que se cuenta el insumo: «kg». */
  unidadBase: string;
}) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales.map((e) => ({ ...e, clave: crypto.randomUUID() })),
  );

  useEffect(
    () =>
      registrarRestaurable("equivalencias", (valor) => {
        try {
          const lista = JSON.parse(valor) as Equivalencia[];
          setFilas(lista.map((e) => ({ ...e, clave: crypto.randomUUID() })));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(nuevas: Fila[]) {
    setFilas(nuevas);
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const valor = JSON.stringify(
    filas.map((f) => ({ unidad_desde_id: f.unidad_desde_id, factor: f.factor })),
  );
  const error = errores.equivalencias?.[0];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 font-semibold">Unidades de compra</legend>
      <p className="text-muted-foreground text-sm">
        Cuánto trae cada unidad en la que se compra. Por ejemplo: 1 saco = 50 {unidadBase}.
      </p>
      <input ref={oculto} type="hidden" name="equivalencias" value={valor} />
      {filas.map((f, i) => (
        <div key={f.clave} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Unidad {i + 1}</span>
            <select
              className={CLASE_CONTROL}
              value={f.unidad_desde_id}
              onChange={(e) =>
                cambiar(
                  filas.map((x) =>
                    x.clave === f.clave ? { ...x, unidad_desde_id: e.target.value } : x,
                  ),
                )
              }
            >
              <option value="">Elige…</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  1 {u.nombre.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>= cuántos {unidadBase}</span>
            <input
              className={CLASE_CONTROL}
              inputMode="decimal"
              value={f.factor}
              onChange={(e) =>
                cambiar(
                  filas.map((x) => (x.clave === f.clave ? { ...x, factor: e.target.value } : x)),
                )
              }
            />
          </label>
          <button
            type="button"
            className="boton-linea size-12 p-0"
            // No lleva el número de fila en el texto: «Quitar la unidad 1»
            // contendría «Unidad 1» como subcadena y `getByLabel("Unidad 1")`
            // (el <select> de esa misma fila) encontraría los dos — el
            // `strict mode` de Playwright lo cazó al escribir el E2E.
            aria-label="Quitar esta unidad de compra"
            onClick={() => cambiar(filas.filter((x) => x.clave !== f.clave))}
          >
            <Trash aria-hidden className="size-5" />
          </button>
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="boton-linea self-start"
        onClick={() => cambiar([...filas, nueva()])}
      >
        <Plus aria-hidden className="size-5" /> Añadir unidad de compra
      </button>
    </fieldset>
  );
}
