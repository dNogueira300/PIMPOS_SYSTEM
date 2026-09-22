import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarNovedad } from "@/lib/acciones/novedades";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_DE_TIPO } from "@/lib/panel/aprobacion";
import { utcALima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/novedades";

export default function Novedades() {
  return (
    <>
      <EncabezadoPanel
        titulo="Novedades"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        descripcion="Las promociones pasan por un administrador antes de publicarse."
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva novedad
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("novedades")
    .select("id, tipo, titulo, estado, vigencia_fin, comentario_revision")
    .is("deleted_at", null)
    // Lo que espera a alguien, arriba.
    .order("estado", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) return <p role="alert">No se pudieron cargar las novedades. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Novedades y promociones"
      filas={data}
      enlace={(n) => `${RUTA}/${n.id}`}
      columnas={[
        { titulo: "Título", celda: (n) => n.titulo, principal: true },
        { titulo: "Tipo", celda: (n) => NOMBRE_DE_TIPO[n.tipo] },
        {
          titulo: "Estado",
          celda: (n) => (
            <>
              <EtiquetaEstado estado={n.estado} />
              {n.comentario_revision ? <span className="ml-1 text-sm">· Devuelta</span> : null}
            </>
          ),
        },
        {
          titulo: "Hasta",
          celda: (n) =>
            n.vigencia_fin ? utcALima(n.vigencia_fin).replace("T", " ") : "Sin fecha de fin",
        },
      ]}
      acciones={(n) => (
        <ConfirmarBorrado
          nombre={`la novedad ${n.titulo}`}
          accion={borrarNovedad.bind(null, n.id)}
        />
      )}
      vacio={<p>Todavía no hay novedades. Crea la primera con «Nueva novedad».</p>}
    />
  );
}
