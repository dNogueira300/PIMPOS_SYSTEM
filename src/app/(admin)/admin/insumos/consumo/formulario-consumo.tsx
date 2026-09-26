"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { registrarConsumo } from "@/lib/acciones/movimientos";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConsumo } from "@/lib/validaciones/movimiento";

const VOLVER = "/admin/insumos";

export function FormularioConsumo({ insumos }: { insumos: InsumoParaLinea[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("consumo", null)}
      accion={registrarConsumo}
      validar={validarConsumo}
      destino={() => VOLVER}
    >
      <Campo nombre="origen_consumo" etiqueta="Cómo salió">
        {(p) => (
          <select {...p} defaultValue="produccion">
            <option value="produccion">Para producción</option>
            <option value="retiro_directo">Retiro directo del almacén</option>
          </select>
        )}
      </Campo>
      <Campo
        nombre="destino_lote"
        etiqueta="Para qué"
        ayuda="Por ejemplo: Pan francés, 2.ª hornada"
      >
        {(p) => <input {...p} autoComplete="off" />}
      </Campo>
      <Campo nombre="area_turno" etiqueta="Área o turno" ayuda="Por ejemplo: Mañana">
        {(p) => <input {...p} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="ocurrido_en"
        etiqueta="Fecha y hora"
        opcional
        ayuda="Déjalo vacío si es ahora."
      >
        {(p) => <input {...p} type="datetime-local" />}
      </Campo>
      <EditorLineas tipo="consumo" insumos={insumos} />
      <Campo nombre="observacion" etiqueta="Observación">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
