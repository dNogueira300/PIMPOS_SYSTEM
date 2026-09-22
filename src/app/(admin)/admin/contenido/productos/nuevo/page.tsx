import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioProducto } from "../formulario-producto";

export default function NuevoProducto() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo producto"
        volver={{ ruta: "/admin/contenido/productos", nombre: "Productos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirAcceso("/admin/contenido/productos");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("categorias_producto")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("orden");
  return <FormularioProducto producto={null} categorias={data ?? []} />;
}
