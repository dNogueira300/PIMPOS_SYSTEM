import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { comoEncendido, describirEstado } from "@/lib/tematicas/estado";

import { FormularioTematica } from "./formulario-tematica";

const RUTA = "/admin/contenido/tematicas";

export default function EditarTematica({ params }: PageProps<"/admin/contenido/tematicas/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({
  params,
}: {
  params: PageProps<"/admin/contenido/tematicas/[slug]">["params"];
}) {
  const { slug } = await params;
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data: t } = await supabase
    .from("tematicas_panel")
    .select(
      "id, nombre, inicio, fin, fecha_evento, encendido_vigente, encendido_hasta, activa, texto_aviso, mensajes_cinta, titulo, entradilla",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!t?.id) notFound();

  const [{ data: elegidos }, { data: catalogo }] = await Promise.all([
    supabase
      .from("tematica_productos")
      .select("producto_id, solo_temporada, orden, productos(nombre)")
      .eq("tematica_id", t.id)
      .order("orden"),
    supabase.from("productos").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  // Las columnas de una vista salen nullables en los tipos generados: se
  // normalizan aquí, nunca con `!`.
  const tematica = {
    id: t.id,
    nombre: t.nombre ?? "",
    inicio: t.inicio ?? "",
    fin: t.fin ?? "",
    fecha_evento: t.fecha_evento,
    encendido_vigente: comoEncendido(t.encendido_vigente),
    texto_aviso: t.texto_aviso,
    mensajes_cinta: t.mensajes_cinta ?? [],
    titulo: t.titulo,
    entradilla: t.entradilla,
  };
  const estado = describirEstado(
    {
      activa: t.activa ?? false,
      encendido_vigente: tematica.encendido_vigente,
      inicio: tematica.inicio,
      fin: tematica.fin,
      encendido_hasta: t.encendido_hasta,
    },
    hoyEnLima(new Date()),
  );

  return (
    <>
      <EncabezadoPanel
        titulo={tematica.nombre}
        descripcion={estado}
        volver={{ ruta: RUTA, nombre: "Temáticas" }}
      />
      <FormularioTematica
        tematica={tematica}
        productos={(elegidos ?? []).map((e) => ({
          producto_id: e.producto_id,
          nombre: e.productos?.nombre ?? "Un producto",
          solo_temporada: e.solo_temporada,
        }))}
        catalogo={catalogo ?? []}
      />
    </>
  );
}
