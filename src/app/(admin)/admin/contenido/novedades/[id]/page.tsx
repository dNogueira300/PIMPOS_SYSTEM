import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { accionesDisponibles } from "@/lib/panel/aprobacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioNovedad } from "../formulario-novedad";

type Params = PageProps<"/admin/contenido/novedades/[id]">["params"];

export default function EditarNovedad({ params }: PageProps<"/admin/contenido/novedades/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  const sesion = await exigirAcceso("/admin/contenido/novedades");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("novedades")
    .select(
      "id, tipo, titulo, resumen, contenido, imagen_url, vigencia_inicio, vigencia_fin, estado, comentario_revision",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={data.titulo}
        volver={{ ruta: "/admin/contenido/novedades", nombre: "Novedades" }}
        accion={<EtiquetaEstado estado={data.estado} />}
      />
      <FormularioNovedad
        novedad={data}
        acciones={accionesDisponibles(sesion.rol, data.tipo, data.estado)}
      />
    </>
  );
}
