import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioTestimonio } from "../formulario-testimonio";

const RUTA = "/admin/contenido/testimonios";

export default function EditarTestimonio({
  params,
}: PageProps<"/admin/contenido/testimonios/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/testimonios/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("testimonios")
    .select("id, nombre, texto, procedencia, estado, es_demo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={`Testimonio de ${data.nombre}`}
        volver={{ ruta: RUTA, nombre: "Testimonios" }}
      />
      <FormularioTestimonio testimonio={data} />
    </>
  );
}
