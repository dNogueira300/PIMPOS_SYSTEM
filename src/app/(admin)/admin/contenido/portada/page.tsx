import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarSlide } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/portada";

export default function Portada() {
  return (
    <>
      <EncabezadoPanel
        titulo="Portada"
        descripcion="Las fotos grandes del inicio del sitio, en el orden en que pasan."
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo slide
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
    .from("slides")
    .select("id, titulo, estado, es_demo")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar los slides. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Slides de la portada"
      filas={data}
      enlace={(s) => `${RUTA}/${s.id}`}
      columnas={[
        { titulo: "Titular", celda: (s) => s.titulo, principal: true },
        { titulo: "Estado", celda: (s) => <EtiquetaEstado estado={s.estado} /> },
      ]}
      acciones={(s) => (
        <>
          <BotonesOrden
            nombre={`el slide ${s.titulo}`}
            subir={moverFila.bind(null, "slides", s.id, "arriba")}
            bajar={moverFila.bind(null, "slides", s.id, "abajo")}
            primero={s.id === data[0]?.id}
            ultimo={s.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado nombre={`el slide ${s.titulo}`} accion={borrarSlide.bind(null, s.id)} />
        </>
      )}
      vacio={<p>No hay slides. Sin ninguno, la portada muestra su versión sin carrusel.</p>}
    />
  );
}
