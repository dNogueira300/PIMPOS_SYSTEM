"use client";

import { ArrowDown, ArrowUp, Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

export type ProductoDeTemporada = {
  producto_id: string;
  nombre: string;
  solo_temporada: boolean;
};

/**
 * Los productos de una temática (plan 08, T2): cuáles salen en la sección de
 * temporada, en qué orden, y cuáles solo se venden en ella. Viajan en un campo
 * oculto con JSON, como las presentaciones; la copia local los restaura por
 * `registrarRestaurable`.
 */
export function EditorProductosTemporada({
  iniciales,
  catalogo,
}: {
  iniciales: ProductoDeTemporada[];
  catalogo: readonly { id: string; nombre: string }[];
}) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<ProductoDeTemporada[]>(iniciales);
  const [elegido, setElegido] = useState("");

  useEffect(
    () =>
      registrarRestaurable("productos", (valor) => {
        try {
          const lista = JSON.parse(valor) as { producto_id: string; solo_temporada: boolean }[];
          setFilas(
            lista.flatMap((p) => {
              const producto = catalogo.find((c) => c.id === p.producto_id);
              return producto ? [{ ...p, nombre: producto.nombre }] : [];
            }),
          );
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable, catalogo],
  );

  function cambiar(nuevas: ProductoDeTemporada[]) {
    setFilas(nuevas);
    // Ver SubidaImagen: se avisa a la copia local cuando React ya pintó.
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const mover = (indice: number, hacia: -1 | 1) => {
    const destino = indice + hacia;
    if (destino < 0 || destino >= filas.length) return;
    const copia = [...filas];
    [copia[indice], copia[destino]] = [copia[destino]!, copia[indice]!];
    cambiar(copia);
  };

  const disponibles = catalogo.filter((c) => !filas.some((f) => f.producto_id === c.id));
  const valor = JSON.stringify(
    filas.map((f) => ({ producto_id: f.producto_id, solo_temporada: f.solo_temporada })),
  );
  const mensajes = errores.productos ?? [];

  return (
    <div className="flex flex-col gap-4">
      <input ref={oculto} type="hidden" name="productos" value={valor} />
      <p className="text-muted-foreground text-sm">
        Salen en la sección de temporada de la portada, en este orden (la portada enseña los ocho
        primeros). Marca «Solo se vende en esta temporada» en lo que no se vende el resto del año:
        fuera de la temporada, el sitio no lo muestra.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold">
          Añadir un producto
          <select
            className={CLASE_CONTROL}
            value={elegido}
            onChange={(e) => setElegido(e.currentTarget.value)}
          >
            <option value="">Elige…</option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="boton-linea"
          disabled={!elegido}
          onClick={() => {
            const producto = catalogo.find((c) => c.id === elegido);
            if (!producto) return;
            cambiar([
              ...filas,
              { producto_id: producto.id, nombre: producto.nombre, solo_temporada: false },
            ]);
            setElegido("");
          }}
        >
          <Plus aria-hidden className="size-5" /> Añadir
        </button>
      </div>

      {filas.length === 0 ? (
        <p className="bg-card rounded-xl border p-4 text-sm">
          Todavía no hay productos en esta temática.
        </p>
      ) : (
        <ol aria-label="Productos de la temporada" className="flex flex-col gap-2">
          {filas.map((f, i) => (
            <li
              key={f.producto_id}
              className="bg-muted/40 border-border flex min-w-0 flex-wrap items-center gap-2 rounded-md border p-3"
            >
              <span
                id={`producto-temporada-${f.producto_id}`}
                className="min-w-0 flex-1 font-semibold wrap-anywhere"
              >
                {f.nombre}
              </span>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-describedby={`producto-temporada-${f.producto_id}`}
                  className="accent-exito size-11 shrink-0"
                  checked={f.solo_temporada}
                  onChange={(e) =>
                    cambiar(
                      filas.map((x) =>
                        x.producto_id === f.producto_id
                          ? { ...x, solo_temporada: e.currentTarget.checked }
                          : x,
                      ),
                    )
                  }
                />
                Solo se vende en esta temporada
              </label>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="boton-linea size-11 p-0"
                  aria-label={`Subir ${f.nombre}`}
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  className="boton-linea size-11 p-0"
                  aria-label={`Bajar ${f.nombre}`}
                  onClick={() => mover(i, 1)}
                  disabled={i === filas.length - 1}
                >
                  <ArrowDown aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  className="boton-linea size-11 p-0"
                  aria-label={`Quitar ${f.nombre}`}
                  onClick={() => cambiar(filas.filter((x) => x.producto_id !== f.producto_id))}
                >
                  <Trash aria-hidden className="size-5" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {mensajes.map((m) => (
        <p key={m} role="alert" className="text-destructive text-sm">
          {m}
        </p>
      ))}
    </div>
  );
}
