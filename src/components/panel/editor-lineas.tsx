"use client";

import { Plus, Trash } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { InsumoParaLinea } from "@/lib/insumos/lineas";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

type Tipo = "ingreso" | "consumo" | "baja";

export type Linea = {
  insumo_id: string;
  cantidad: string;
  unidad_id: string;
  precio_unitario?: string;
  fecha_vencimiento?: string;
  codigo_lote?: string;
};
type Fila = Linea & { clave: string };

const nueva = (tipo: Tipo): Fila => ({
  clave: crypto.randomUUID(),
  insumo_id: "",
  cantidad: "",
  unidad_id: "",
  ...(tipo === "ingreso" ? { precio_unitario: "", fecha_vencimiento: "", codigo_lote: "" } : {}),
});

/**
 * Las líneas de un ingreso, de un consumo o de una baja. Viajan en un campo
 * oculto con JSON (como las presentaciones de F4) y se restauran desde la copia
 * local por `registrarRestaurable`. Los errores llegan con su línea:
 * `lineas.0.cantidad` (ver `erroresPorCampo`).
 */
export function EditorLineas({
  tipo,
  insumos,
  unaSola = false,
}: {
  tipo: Tipo;
  insumos: InsumoParaLinea[];
  /** La baja pide un solo insumo. */
  unaSola?: boolean;
}) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<Fila[]>(() => [nueva(tipo)]);

  useEffect(
    () =>
      registrarRestaurable("lineas", (valor) => {
        try {
          const lista = JSON.parse(valor) as Linea[];
          if (lista.length > 0) setFilas(lista.map((l) => ({ ...l, clave: crypto.randomUUID() })));
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

  const actualizar = (clave: string, cambios: Partial<Linea>) =>
    cambiar(filas.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)));

  const valor = JSON.stringify(
    filas.map((f) => ({
      insumo_id: f.insumo_id,
      cantidad: f.cantidad,
      unidad_id: f.unidad_id,
      ...(tipo === "ingreso"
        ? {
            precio_unitario: f.precio_unitario ?? "",
            fecha_vencimiento: f.fecha_vencimiento ?? "",
            codigo_lote: f.codigo_lote ?? "",
          }
        : {}),
    })),
  );
  const errorDe = (i: number, campo: string) => errores[`lineas.${i}.${campo}`]?.[0];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 font-semibold">{unaSola ? "Insumo" : "Insumos"}</legend>
      <input ref={oculto} type="hidden" name="lineas" value={valor} />
      {filas.map((f, i) => {
        const insumo = insumos.find((x) => x.id === f.insumo_id);
        const n = i + 1;
        return (
          <div
            key={f.clave}
            className="bg-card flex flex-col gap-3 rounded-xl border p-3"
            data-linea={n}
          >
            <ControlLinea
              etiqueta={unaSola ? "Insumo" : `Insumo ${n}`}
              error={errorDe(i, "insumo_id")}
            >
              {(p) => (
                <select
                  {...p}
                  value={f.insumo_id}
                  onChange={(e) => {
                    const elegido = insumos.find((x) => x.id === e.target.value);
                    actualizar(f.clave, {
                      insumo_id: e.target.value,
                      // La unidad del insumo anterior no vale para el nuevo.
                      unidad_id: elegido?.unidades[0]?.id ?? "",
                      // Y tampoco su fecha de vencimiento ni su lote: si venían
                      // de un perecible y el nuevo insumo no lo es (o al
                      // revés), una fecha o un código que ya no aplican
                      // viajarían igual en el JSON de la línea.
                      fecha_vencimiento: "",
                      codigo_lote: "",
                    });
                  }}
                >
                  <option value="">Elige…</option>
                  {insumos.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              )}
            </ControlLinea>
            <div className="grid grid-cols-2 gap-2">
              <ControlLinea
                etiqueta={`Cantidad ${unaSola ? "" : n}`.trim()}
                error={errorDe(i, "cantidad")}
              >
                {(p) => (
                  <input
                    {...p}
                    inputMode="decimal"
                    value={f.cantidad}
                    onChange={(e) => actualizar(f.clave, { cantidad: e.target.value })}
                  />
                )}
              </ControlLinea>
              <ControlLinea
                etiqueta={`Unidad ${unaSola ? "" : n}`.trim()}
                error={errorDe(i, "unidad_id")}
              >
                {(p) => (
                  <select
                    {...p}
                    value={f.unidad_id}
                    onChange={(e) => actualizar(f.clave, { unidad_id: e.target.value })}
                  >
                    {(insumo?.unidades ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </ControlLinea>
            </div>
            {tipo === "ingreso" ? (
              <div className="grid grid-cols-2 gap-2">
                <ControlLinea
                  // «Precio unitario», no «Precio por unidad»: ese segundo
                  // texto contiene «unidad N» como subcadena y colisiona con
                  // el `<select>` «Unidad N» en `getByLabel` (modo estricto de
                  // Playwright, y con el mismo riesgo para cualquier lector
                  // de pantalla que navegue por coincidencia de nombre).
                  etiqueta={`Precio unitario ${n} (S/)`}
                  error={errorDe(i, "precio_unitario")}
                >
                  {(p) => (
                    <input
                      {...p}
                      inputMode="decimal"
                      value={f.precio_unitario ?? ""}
                      onChange={(e) => actualizar(f.clave, { precio_unitario: e.target.value })}
                    />
                  )}
                </ControlLinea>
                {insumo?.es_perecible ? (
                  <ControlLinea etiqueta={`Vence ${n}`} error={errorDe(i, "fecha_vencimiento")}>
                    {(p) => (
                      <input
                        {...p}
                        type="date"
                        required
                        value={f.fecha_vencimiento ?? ""}
                        onChange={(e) => actualizar(f.clave, { fecha_vencimiento: e.target.value })}
                      />
                    )}
                  </ControlLinea>
                ) : null}
              </div>
            ) : null}
            {!unaSola && filas.length > 1 ? (
              <button
                type="button"
                className="boton-linea self-end"
                onClick={() => cambiar(filas.filter((x) => x.clave !== f.clave))}
              >
                <Trash aria-hidden className="size-5" /> Quitar la línea {n}
              </button>
            ) : null}
          </div>
        );
      })}
      {errores.lineas?.[0] ? (
        <p role="alert" className="text-destructive text-sm">
          {errores.lineas[0]}
        </p>
      ) : null}
      {!unaSola ? (
        <button
          type="button"
          className="boton-linea self-start"
          onClick={() => cambiar([...filas, nueva(tipo)])}
        >
          <Plus aria-hidden className="size-5" /> Añadir otro insumo
        </button>
      ) : null}
    </fieldset>
  );
}

function ControlLinea({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error: string | undefined;
  children: (p: {
    id: string;
    className: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = `linea-${etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={id}>
      <span>{etiqueta}</span>
      {children({
        id,
        className: CLASE_CONTROL,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error ? (
        <span id={`${id}-error`} className="text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}
