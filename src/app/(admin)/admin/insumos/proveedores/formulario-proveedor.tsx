"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarProveedor } from "@/lib/acciones/proveedores";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarProveedor } from "@/lib/validaciones/proveedor";

export type ProveedorEditable = {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  observacion: string | null;
};

const VOLVER = "/admin/insumos/proveedores";

export function FormularioProveedor({ proveedor }: { proveedor: ProveedorEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("proveedor", proveedor?.id ?? null)}
      accion={guardarProveedor}
      validar={validarProveedor}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={proveedor?.id ?? ""} />
      <Campo nombre="nombre" etiqueta="Nombre">
        {(p) => <input {...p} defaultValue={proveedor?.nombre ?? ""} autoComplete="off" />}
      </Campo>
      <Campo nombre="contacto" etiqueta="Persona de contacto" opcional>
        {(p) => <input {...p} defaultValue={proveedor?.contacto ?? ""} />}
      </Campo>
      <Campo nombre="telefono" etiqueta="Teléfono" opcional>
        {(p) => (
          <input {...p} type="tel" inputMode="tel" defaultValue={proveedor?.telefono ?? ""} />
        )}
      </Campo>
      <Campo nombre="observacion" etiqueta="Qué nos vende" opcional>
        {(p) => <textarea {...p} rows={2} defaultValue={proveedor?.observacion ?? ""} />}
      </Campo>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
