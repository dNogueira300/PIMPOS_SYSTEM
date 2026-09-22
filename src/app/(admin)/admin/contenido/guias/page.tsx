import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarGuia } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/guias";

export default function Guias() {
  return (
    <>
      <EncabezadoPanel
        titulo="Guías"
        descripcion="«Cómo hacer un pedido», «Cómo hacer un reclamo». Salen en Preguntas frecuentes."
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva guía
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
    .from("guias")
    .select("id, titulo, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las guías. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Guías"
      filas={data}
      enlace={(g) => `${RUTA}/${g.id}`}
      columnas={[
        { titulo: "Título", celda: (g) => g.titulo, principal: true },
        { titulo: "Estado", celda: (g) => <EtiquetaEstado estado={g.estado} /> },
      ]}
      acciones={(g) => (
        <>
          <BotonesOrden
            nombre={`la guía ${g.titulo}`}
            subir={moverFila.bind(null, "guias", g.id, "arriba")}
            bajar={moverFila.bind(null, "guias", g.id, "abajo")}
            primero={g.id === data[0]?.id}
            ultimo={g.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado nombre={`la guía ${g.titulo}`} accion={borrarGuia.bind(null, g.id)} />
        </>
      )}
      vacio={<p>No hay guías. Añade la primera con «Nueva guía».</p>}
    />
  );
}
