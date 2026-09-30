import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

import { FormularioZona } from "../formulario-zona";

const RUTA = "/admin/clientes/zonas";

export default function EditarZona({ params }: PageProps<"/admin/clientes/zonas/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/clientes/zonas/[id]">["params"] }) {
  const { id } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("zonas_reparto")
    .select("id, nombre, descripcion")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  return (
    <>
      <EncabezadoPanel titulo={data.nombre} volver={{ ruta: RUTA, nombre: "Zonas" }} />
      <FormularioZona zona={data} />
    </>
  );
}
