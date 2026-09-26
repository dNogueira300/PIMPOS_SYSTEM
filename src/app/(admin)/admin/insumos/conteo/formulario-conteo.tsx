"use client";

import { useEffect, useRef, useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, CLASE_CONTROL } from "@/components/panel/campo";
import { FormularioPanel, useFormularioPanel } from "@/components/panel/formulario-panel";
import { registrarConteo } from "@/lib/acciones/kardex";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConteo } from "@/lib/validaciones/conteo";

export type InsumoAContar = {
  id: string;
  nombre: string;
  unidad_base: string;
  hay: string; // ya escrito: «62 kg (1 saco y 12 kg)»
  es_perecible: boolean;
};

type Linea = { contado: string; precio_unitario: string; fecha_vencimiento: string };

const VOLVER = "/admin/insumos";

export function FormularioConteo({ insumos }: { insumos: InsumoAContar[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("conteo", null)}
      accion={registrarConteo}
      validar={validarConteo}
      destino={() => VOLVER}
    >
      <Campo
        nombre="observacion"
        etiqueta="Por qué se cuenta"
        ayuda="Por ejemplo: Inventario inicial"
      >
        {(p) => <input {...p} defaultValue="" />}
      </Campo>
      <p className="text-muted-foreground text-sm">
        Escribe solo lo que contaste. Un insumo en blanco no se toca.
      </p>
      <Lineas insumos={insumos} />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}

function Lineas({ insumos }: { insumos: InsumoAContar[] }) {
  const { errores, registrarRestaurable } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [valores, setValores] = useState<Record<string, Linea>>({});

  useEffect(
    () =>
      registrarRestaurable("lineas", (valor) => {
        try {
          const lista = JSON.parse(valor) as (Linea & { insumo_id: string })[];
          setValores(Object.fromEntries(lista.map(({ insumo_id, ...l }) => [insumo_id, l])));
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(id: string, cambios: Partial<Linea>) {
    setValores((v) => {
      const previa: Linea = v[id] ?? { contado: "", precio_unitario: "", fecha_vencimiento: "" };
      return { ...v, [id]: { ...previa, ...cambios } };
    });
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  const valor = JSON.stringify(
    Object.entries(valores).map(([insumo_id, l]) => ({ insumo_id, ...l })),
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Insumos</legend>
      <input ref={oculto} type="hidden" name="lineas" value={valor} />
      {errores.lineas?.[0] ? (
        <p role="alert" className="text-destructive text-sm">
          {errores.lineas[0]}
        </p>
      ) : null}
      {insumos.map((i) => (
        <div key={i.id} className="bg-card flex flex-col gap-2 rounded-xl border p-3">
          <p className="font-semibold">{i.nombre}</p>
          <p className="text-muted-foreground text-sm">Según el sistema: {i.hay}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>
                Contado de {i.nombre} ({i.unidad_base})
              </span>
              <input
                className={CLASE_CONTROL}
                inputMode="decimal"
                value={valores[i.id]?.contado ?? ""}
                onChange={(e) => cambiar(i.id, { contado: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Precio por {i.unidad_base} (S/), si sobra</span>
              <input
                className={CLASE_CONTROL}
                inputMode="decimal"
                value={valores[i.id]?.precio_unitario ?? ""}
                onChange={(e) => cambiar(i.id, { precio_unitario: e.target.value })}
              />
            </label>
            {i.es_perecible ? (
              <label className="col-span-2 flex flex-col gap-1 text-sm">
                <span>Vence (si sobra) — {i.nombre}</span>
                <input
                  type="date"
                  className={CLASE_CONTROL}
                  value={valores[i.id]?.fecha_vencimiento ?? ""}
                  onChange={(e) => cambiar(i.id, { fecha_vencimiento: e.target.value })}
                />
              </label>
            ) : null}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
