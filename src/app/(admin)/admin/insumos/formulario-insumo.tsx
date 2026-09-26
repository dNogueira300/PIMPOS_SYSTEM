"use client";

import { useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import {
  EditorEquivalencias,
  type Equivalencia,
  type UnidadOpcion,
} from "@/components/panel/editor-equivalencias";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarInsumo } from "@/lib/acciones/insumos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarInsumo } from "@/lib/validaciones/insumo";

export type InsumoEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad_base_id: string;
  presentacion: string | null;
  stock_minimo: number;
  es_perecible: boolean;
  proveedor_habitual_id: string | null;
  equivalencias: Equivalencia[];
  /** Con movimientos, la unidad base queda fija (0034). */
  tieneMovimientos: boolean;
};

const VOLVER = "/admin/insumos";

export function FormularioInsumo({
  insumo,
  unidadesBase,
  unidadesCompra,
  proveedores,
}: {
  insumo: InsumoEditable | null;
  unidadesBase: UnidadOpcion[];
  unidadesCompra: UnidadOpcion[];
  proveedores: { id: string; nombre: string }[];
}) {
  const [base, setBase] = useState(insumo?.unidad_base_id ?? "");
  const codigoBase = unidadesBase.find((u) => u.id === base)?.codigo ?? "unidades base";

  return (
    <FormularioPanel
      clave={claveDeBorrador("insumo", insumo?.id ?? null)}
      accion={guardarInsumo}
      validar={validarInsumo}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={insumo?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre">
        {(p) => <input {...p} defaultValue={insumo?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="unidad_base_id"
        etiqueta="Se cuenta en"
        ayuda={
          insumo?.tieneMovimientos
            ? "Ya tiene movimientos: esta unidad no se puede cambiar."
            : "La unidad en la que se lleva el saldo: kg, litros, unidades…"
        }
      >
        {(p) => (
          <select
            {...p}
            value={base}
            disabled={insumo?.tieneMovimientos}
            onChange={(e) => setBase(e.target.value)}
          >
            <option value="">Elige…</option>
            {unidadesBase.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      {insumo?.tieneMovimientos ? <input type="hidden" name="unidad_base_id" value={base} /> : null}
      <Campo
        nombre="presentacion"
        etiqueta="Presentación"
        opcional
        ayuda="Por ejemplo: Saco de 50 kg"
      >
        {(p) => <input {...p} defaultValue={insumo?.presentacion ?? ""} />}
      </Campo>
      <Campo nombre="stock_minimo" etiqueta={`Stock mínimo (en ${codigoBase})`}>
        {(p) => (
          <input {...p} inputMode="decimal" defaultValue={String(insumo?.stock_minimo ?? "0")} />
        )}
      </Campo>
      <Interruptor
        nombre="es_perecible"
        etiqueta="Vence"
        ayuda="Cada ingreso pedirá la fecha de vencimiento"
        marcado={insumo?.es_perecible ?? false}
      />
      <Campo nombre="proveedor_habitual_id" etiqueta="Proveedor habitual" opcional>
        {(p) => (
          <select {...p} defaultValue={insumo?.proveedor_habitual_id ?? ""}>
            <option value="">Ninguno</option>
            {proveedores.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo nombre="descripcion" etiqueta="Notas" opcional>
        {(p) => <textarea {...p} rows={2} defaultValue={insumo?.descripcion ?? ""} />}
      </Campo>
      <EditorEquivalencias
        iniciales={insumo?.equivalencias ?? []}
        unidades={unidadesCompra.filter((u) => u.id !== base)}
        unidadBase={codigoBase}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
