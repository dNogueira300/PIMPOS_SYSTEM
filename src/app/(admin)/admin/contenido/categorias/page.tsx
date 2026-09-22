import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarCategoria } from "@/lib/acciones/categorias";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/categorias";

export default function Categorias() {
  return (
    <>
      <EncabezadoPanel
        titulo="Categorías"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva categoría
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
    .from("categorias_producto")
    .select("id, nombre, estado, orden")
    .is("deleted_at", null)
    .order("orden")
    .order("id");

  if (error) {
    return <p role="alert">No se pudieron cargar las categorías. Recarga la página.</p>;
  }

  return (
    <ListaAdaptable
      etiqueta="Categorías del catálogo"
      filas={data}
      enlace={(c) => `${RUTA}/${c.id}`}
      columnas={[
        { titulo: "Nombre", celda: (c) => c.nombre, principal: true },
        { titulo: "Estado", celda: (c) => <EtiquetaEstado estado={c.estado} /> },
      ]}
      acciones={(c) => (
        <>
          <BotonesOrden
            nombre={`la categoría ${c.nombre}`}
            subir={moverFila.bind(null, "categorias_producto", c.id, "arriba")}
            bajar={moverFila.bind(null, "categorias_producto", c.id, "abajo")}
            primero={c.id === data[0]?.id}
            ultimo={c.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`la categoría ${c.nombre}`}
            accion={borrarCategoria.bind(null, c.id)}
          />
        </>
      )}
      vacio={<p>Todavía no hay categorías. Crea la primera con «Nueva categoría».</p>}
    />
  );
}
