import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { FormularioProveedor } from "../formulario-proveedor";

export default function NuevoProveedor() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo proveedor"
        volver={{ ruta: "/admin/insumos/proveedores", nombre: "Proveedores" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/proveedores");
  return <FormularioProveedor proveedor={null} />;
}
