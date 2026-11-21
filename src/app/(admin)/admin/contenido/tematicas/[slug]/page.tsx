import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { comoEncendido, describirEstado } from "@/lib/tematicas/estado";
import { alternativaDe } from "@/lib/tematicas/disenos";
import { comoEstilo } from "@/lib/tematicas/estilos";
import { avisoDeAlternativa } from "@/lib/tematicas/nombre";

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
      "id, nombre, inicio, fin, fecha_evento, encendido_vigente, encendido_hasta, activa, estilo, texto_aviso, mensajes_cinta, titulo, entradilla",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!t?.id) notFound();

  // La otra fiesta de la misma fecha, si la tiene (plan 08.2): su nombre va en
  // la ayuda de la pestaña «Cuándo».
  const alternativa = alternativaDe(slug);
  const [
    { data: elegidos, error: errorElegidos },
    { data: catalogo, error: errorCatalogo },
    { data: otra, error: errorOtra },
  ] = await Promise.all([
    supabase
      .from("tematica_productos")
      .select("producto_id, solo_temporada, orden, productos(nombre)")
      .eq("tematica_id", t.id)
      .order("orden"),
    supabase.from("productos").select("id, nombre").is("deleted_at", null).order("nombre"),
    alternativa
      ? supabase.from("tematicas_panel").select("nombre").eq("slug", alternativa).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  // Sin el nombre de la otra solo falta la línea de ayuda: el formulario sirve
  // igual. Se deja en el registro para saber por qué.
  if (errorOtra) {
    console.error(
      `[panel] la alternativa de ${slug}: código ${errorOtra.code ?? "?"} — ${errorOtra.message}`,
    );
  }
  // Sin sus productos no se pinta el formulario: «Guardar» con la lista vacía
  // borraría todos los de la temática (`guardar_tematica` quita lo que no llega).
  if (errorElegidos || errorCatalogo || !elegidos || !catalogo) {
    return (
      <p role="alert">No se pudieron cargar los productos de la temática. Recarga la página.</p>
    );
  }

  // Las columnas de una vista salen nullables en los tipos generados: se
  // normalizan aquí, nunca con `!`.
  const tematica = {
    id: t.id,
    slug,
    nombre: t.nombre ?? "",
    inicio: t.inicio ?? "",
    fin: t.fin ?? "",
    fecha_evento: t.fecha_evento,
    encendido_vigente: comoEncendido(t.encendido_vigente),
    estilo: comoEstilo(slug, t.estilo),
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
        productos={elegidos.map((e) => ({
          producto_id: e.producto_id,
          nombre: e.productos?.nombre ?? "Un producto",
          solo_temporada: e.solo_temporada,
        }))}
        catalogo={catalogo}
        avisoAlternativa={
          alternativa && otra?.nombre
            ? avisoDeAlternativa(slug, tematica.nombre, alternativa, otra.nombre)
            : null
        }
      />
    </>
  );
}
