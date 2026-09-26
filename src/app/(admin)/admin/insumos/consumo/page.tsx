import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas } from "../datos-movimiento";
import { FormularioConsumo } from "./formulario-consumo";

export default function RegistrarConsumo() {
  return (
    <>
      <EncabezadoPanel
        titulo="Registrar consumo"
        descripcion="Lo que salió del almacén hoy."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/consumo");
  return <FormularioConsumo insumos={await insumosParaLineas()} />;
}
