import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioProveedor } from "../formulario-proveedor";

const RUTA = "/admin/insumos/proveedores";

export default function EditarProveedor({ params }: PageProps<"/admin/insumos/proveedores/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/insumos/proveedores/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("proveedores")
    .select("id, nombre, contacto, telefono, observacion")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Proveedores" }} />
      <FormularioProveedor proveedor={data} />
    </>
  );
}
