import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioGuia } from "../formulario-guia";

const RUTA = "/admin/contenido/guias";

export default function EditarGuia({ params }: PageProps<"/admin/contenido/guias/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/contenido/guias/[id]">["params"] }) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("guias")
    .select("id, titulo, resumen, contenido, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.titulo} volver={{ ruta: RUTA, nombre: "Guías" }} />
      <FormularioGuia guia={data} />
    </>
  );
}
