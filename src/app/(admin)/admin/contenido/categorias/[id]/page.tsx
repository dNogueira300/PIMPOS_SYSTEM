import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioCategoria } from "../formulario-categoria";

const RUTA = "/admin/contenido/categorias";

export default function EditarCategoria({ params }: PageProps<"/admin/contenido/categorias/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/categorias/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("categorias_producto")
    .select("id, nombre, descripcion, imagen_url, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Categorías" }} />
      <FormularioCategoria categoria={data} />
    </>
  );
}
