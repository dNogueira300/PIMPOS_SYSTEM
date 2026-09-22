import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioSlide } from "../formulario-slide";

const RUTA = "/admin/contenido/portada";

export default function EditarSlide({ params }: PageProps<"/admin/contenido/portada/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/portada/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("slides")
    .select(
      "id, titulo, subtitulo, imagen_url, imagen_movil_url, imagen_alt, enlace_url, texto_boton, enfoque, estado, vigencia_inicio, vigencia_fin",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.titulo} volver={{ ruta: RUTA, nombre: "Portada" }} />
      <FormularioSlide slide={data} />
    </>
  );
}
