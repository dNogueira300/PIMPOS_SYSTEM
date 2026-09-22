import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioFotoGaleria } from "../formulario-foto-galeria";

const RUTA = "/admin/contenido/galeria";

export default function EditarFoto({ params }: PageProps<"/admin/contenido/galeria/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/galeria/[id]">["params"];
}) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("galeria")
    .select("id, titulo, alt, ruta, categoria, estado")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel titulo={data.titulo ?? "Foto"} volver={{ ruta: RUTA, nombre: "Galería" }} />
      <FormularioFotoGaleria foto={data} />
    </>
  );
}
