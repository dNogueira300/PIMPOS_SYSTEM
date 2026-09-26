import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas } from "../../datos-movimiento";
import { FormularioBaja } from "./formulario-baja";

export default function PedirBaja() {
  return (
    <>
      <EncabezadoPanel
        titulo="Pedir baja"
        descripcion="Lo que se perdió, venció o se devolvió. Se descuenta cuando un administrador lo apruebe."
        volver={{ ruta: "/admin/insumos/bajas", nombre: "Bajas" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/bajas/nueva");
  return <FormularioBaja insumos={await insumosParaLineas()} />;
}
