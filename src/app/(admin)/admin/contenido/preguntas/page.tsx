import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarFaq } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/contenido/preguntas";

export default function Preguntas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Preguntas frecuentes"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva pregunta
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
    .from("faqs")
    .select("id, pregunta, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudieron cargar las preguntas. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Preguntas frecuentes"
      filas={data}
      enlace={(f) => `${RUTA}/${f.id}`}
      columnas={[
        { titulo: "Pregunta", celda: (f) => f.pregunta, principal: true },
        { titulo: "Estado", celda: (f) => <EtiquetaEstado estado={f.estado} /> },
      ]}
      acciones={(f) => (
        <>
          <BotonesOrden
            nombre={`la pregunta ${f.pregunta}`}
            subir={moverFila.bind(null, "faqs", f.id, "arriba")}
            bajar={moverFila.bind(null, "faqs", f.id, "abajo")}
            primero={f.id === data[0]?.id}
            ultimo={f.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`la pregunta «${f.pregunta}»`}
            accion={borrarFaq.bind(null, f.id)}
          />
        </>
      )}
      vacio={<p>No hay preguntas. Añade la primera con «Nueva pregunta».</p>}
    />
  );
}
