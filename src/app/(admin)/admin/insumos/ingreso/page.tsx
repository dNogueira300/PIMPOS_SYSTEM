import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";

import { insumosParaLineas, proveedoresActivos } from "../datos-movimiento";
import { FormularioIngreso } from "./formulario-ingreso";

export default function RegistrarIngreso() {
  return (
    <>
      <EncabezadoPanel
        titulo="Registrar ingreso"
        descripcion="Lo que llegó con una boleta, factura o guía."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/insumos/ingreso");
  const [insumos, proveedores] = await Promise.all([insumosParaLineas(), proveedoresActivos()]);
  return <FormularioIngreso insumos={insumos} proveedores={proveedores} />;
}
