import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioFaq } from "../formulario-faq";

const RUTA = "/admin/contenido/preguntas";

export default function EditarPregunta({ params }: PageProps<"/admin/contenido/preguntas/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/preguntas/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("faqs")
    .select("id, pregunta, respuesta, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo="Editar pregunta"
        volver={{ ruta: RUTA, nombre: "Preguntas frecuentes" }}
      />
      <FormularioFaq faq={data} />
    </>
  );
}
