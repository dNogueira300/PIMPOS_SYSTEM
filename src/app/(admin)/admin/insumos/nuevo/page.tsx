import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { datosDelFormulario } from "../datos-formulario";
import { FormularioInsumo } from "../formulario-insumo";

export default function NuevoInsumo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo insumo"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos");
  const datos = await datosDelFormulario();
  return <FormularioInsumo insumo={null} {...datos} />;
}
