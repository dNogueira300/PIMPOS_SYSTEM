"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { registrarIngreso } from "@/lib/acciones/movimientos";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarIngreso } from "@/lib/validaciones/movimiento";

const VOLVER = "/admin/insumos";

export function FormularioIngreso({
  insumos,
  proveedores,
}: {
  insumos: InsumoParaLinea[];
  proveedores: { id: string; nombre: string }[];
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("ingreso", null)}
      accion={registrarIngreso}
      validar={validarIngreso}
      destino={() => VOLVER}
    >
      <Campo nombre="proveedor_id" etiqueta="Proveedor">
        {(p) => (
          <select {...p} defaultValue="">
            <option value="">Elige…</option>
            {proveedores.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo nombre="documento_tipo" etiqueta="Documento">
          {(p) => (
            <select {...p} defaultValue="boleta">
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="guia">Guía</option>
            </select>
          )}
        </Campo>
        <Campo nombre="documento_numero" etiqueta="Número">
          {(p) => <input {...p} autoComplete="off" />}
        </Campo>
      </div>
      <Campo
        nombre="ocurrido_en"
        etiqueta="Fecha y hora"
        opcional
        ayuda="Déjalo vacío si llegó ahora."
      >
        {(p) => <input {...p} type="datetime-local" />}
      </Campo>
      <EditorLineas tipo="ingreso" insumos={insumos} />
      <Campo nombre="observacion" etiqueta="Observación" ayuda="Cómo llegó: «Todo en buen estado».">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <Interruptor
        nombre="confirmar_repetido"
        etiqueta="Es otro documento aunque el número se repita"
        marcado={false}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
