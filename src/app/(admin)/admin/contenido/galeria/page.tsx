import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarBorrado } from "@/components/panel/confirmar-borrado";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaEstado } from "@/components/panel/etiqueta-estado";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { borrarFotoGaleria } from "@/lib/acciones/contenido";
import { moverFila } from "@/lib/acciones/orden";
import { exigirAcceso } from "@/lib/auth/sesion";
import { urlDeImagen } from "@/lib/supabase/publico";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NOMBRE_CATEGORIA_GALERIA } from "@/lib/validaciones/contenido";

const RUTA = "/admin/contenido/galeria";

export default function Galeria() {
  return (
    <>
      <EncabezadoPanel
        titulo="Galería"
        volver={{ ruta: "/admin/contenido", nombre: "Contenido" }}
        accion={
          <Link href={`${RUTA}/nueva`} className="boton-cta">
            <Plus aria-hidden className="size-5" /> Nueva foto
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
    .from("galeria")
    .select("id, titulo, alt, ruta, categoria, estado")
    .is("deleted_at", null)
    .order("orden")
    .order("id");
  if (error) return <p role="alert">No se pudo cargar la galería. Recarga la página.</p>;

  return (
    <ListaAdaptable
      etiqueta="Fotos de la galería"
      filas={data}
      enlace={(f) => `${RUTA}/${f.id}`}
      columnas={[
        {
          titulo: "Foto",
          principal: true,
          celda: (f) => (
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
              <img
                src={urlDeImagen("galeria", f.ruta) ?? ""}
                alt=""
                className="size-12 rounded-lg object-cover"
              />
              {f.titulo ?? f.alt}
            </span>
          ),
        },
        {
          titulo: "De qué es",
          celda: (f) =>
            NOMBRE_CATEGORIA_GALERIA[f.categoria as keyof typeof NOMBRE_CATEGORIA_GALERIA],
        },
        { titulo: "Estado", celda: (f) => <EtiquetaEstado estado={f.estado} /> },
      ]}
      acciones={(f) => (
        <>
          <BotonesOrden
            nombre={`la foto ${f.titulo ?? f.alt}`}
            subir={moverFila.bind(null, "galeria", f.id, "arriba")}
            bajar={moverFila.bind(null, "galeria", f.id, "abajo")}
            primero={f.id === data[0]?.id}
            ultimo={f.id === data.at(-1)?.id}
          />
          <ConfirmarBorrado
            nombre={`la foto ${f.titulo ?? f.alt}`}
            accion={borrarFotoGaleria.bind(null, f.id)}
          />
        </>
      )}
      vacio={<p>La galería está vacía. Añade la primera foto con «Nueva foto».</p>}
    />
  );
}
