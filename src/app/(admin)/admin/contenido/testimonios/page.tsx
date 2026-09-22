import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarTestimonio } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/testimonios";

export default function Testimonios() {
  return (
    <>
      <EncabezadoPanel
        titulo="Testimonios"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nuevo testimonio
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
    .from("testimonios")
    .select("id, nombre, texto, estado, es_demo")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar los testimonios. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Testimonios"
      filas={data}
      enlace={(t) => `${RUTA}/${t.id}`}
      columnas={[
        { titulo: "Nombre", celda: (t) => t.nombre, principal: true },
        {
          titulo: "Dice",
          celda: (t) => (t.texto.length > 60 ? `${t.texto.slice(0, 60)}…` : t.texto),
        },
        {
          titulo: "Estado",
          celda: (t) =>
            t.es_demo ? (
              <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
                De ejemplo
              </span>
            ) : (
              <EtiquetaEstado estado={t.estado} />
            ),
        },
      ]}
      acciones={(t) => (
        <>
          <BotonesOrden
            nombre={`el testimonio de ${t.nombre}`}
            subir={moverFila.bind(null, "testimonios", t.id, "arriba")}
            bajar={moverFila.bind(null, "testimonios", t.id, "abajo")}
            primero={t.id === data[0]?.id}
            ultimo={t.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`el testimonio de ${t.nombre}`}
            accion={borrarTestimonio.bind(null, t.id)}
          />
        </>
      )}
      vacio={<p>No hay testimonios. Sin ninguno, la portada no muestra esa sección.</p>}
    />
  );
}
