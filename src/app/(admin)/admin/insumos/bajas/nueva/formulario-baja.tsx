"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { EditorLineas } from "@/components/panel/editor-lineas";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { pedirBaja } from "@/lib/acciones/bajas";
import { NOMBRE_MOTIVO } from "@/lib/insumos/kardex";
import type { InsumoParaLinea } from "@/lib/insumos/lineas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { MOTIVOS, validarBaja } from "@/lib/validaciones/baja";

const VOLVER = "/admin/insumos/bajas";

export function FormularioBaja({ insumos }: { insumos: InsumoParaLinea[] }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("baja", null)}
      accion={pedirBaja}
      validar={validarBaja}
      destino={() => VOLVER}
    >
      <EditorLineas tipo="baja" insumos={insumos} unaSola />
      <Campo nombre="motivo_baja" etiqueta="Motivo">
        {(p) => (
          <select {...p} defaultValue="">
            <option value="">Elige…</option>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {NOMBRE_MOTIVO[m]}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo nombre="observacion" etiqueta="Qué pasó">
        {(p) => <textarea {...p} rows={2} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
