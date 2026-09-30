"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarZona } from "@/lib/acciones/zonas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarZona } from "@/lib/validaciones/zona";

const VOLVER = "/admin/clientes/zonas";

export function FormularioZona({
  zona,
}: {
  zona: { id: string; nombre: string; descripcion: string | null } | null;
}) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("zona", zona?.id ?? null)}
      accion={guardarZona}
      validar={validarZona}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={zona?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre de la zona">
        {(p) => <input {...p} defaultValue={zona?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo
        nombre="descripcion"
        etiqueta="Descripción"
        opcional
        ayuda="Por ejemplo, qué calles o barrios entran."
      >
        {(p) => <textarea {...p} rows={2} defaultValue={zona?.descripcion ?? ""} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
