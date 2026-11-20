import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EnlaceHistorial } from "@/components/panel/enlace-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { avisoSoloTemporada } from "@/lib/tematicas/estado";
import { nombreEnFrase } from "@/lib/tematicas/nombre";

import { FormularioProducto } from "../formulario-producto";

type Params = PageProps<"/admin/contenido/productos/[id]">["params"];

export default function EditarProducto({ params }: PageProps<"/admin/contenido/productos/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Params }) {
  const { id } = await params;
  const sesion = await exigirAcceso("/admin/contenido/productos");
  const supabase = await crearClienteServidor();

  const [{ data: producto }, { data: categorias }, { data: temporadas }, { data: activa }] =
    await Promise.all([
      supabase
        .from("productos")
        .select(
          "id, nombre, categoria_id, descripcion, destacado, estado, producto_variantes(id, nombre, precio, unidad_venta, orden, deleted_at), producto_imagenes(id, ruta, alt, es_principal, orden)",
        )
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("categorias_producto")
        .select("id, nombre")
        .is("deleted_at", null)
        .order("orden"),
      // Las temáticas en las que este producto solo se vende en su temporada
      // (plan 08): la ficha avisa de si hoy se ve en el sitio.
      supabase
        .from("tematica_productos")
        .select("tematica_id, tematicas(nombre, slug)")
        .eq("producto_id", id)
        .eq("solo_temporada", true),
      supabase.from("tematicas_panel").select("id").eq("activa", true).maybeSingle(),
    ]);

  if (!producto) notFound();

  const editable = {
    id: producto.id,
    nombre: producto.nombre,
    categoria_id: producto.categoria_id,
    descripcion: producto.descripcion,
    destacado: producto.destacado,
    estado: producto.estado,
    presentaciones: producto.producto_variantes
      .filter((v) => v.deleted_at === null)
      .sort((a, b) => a.orden - b.orden)
      // numeric llega como número en JSON; se vuelve texto con dos decimales para el campo.
      .map((v) => ({
        id: v.id,
        nombre: v.nombre,
        precio: Number(v.precio).toFixed(2),
        unidad_venta: v.unidad_venta,
      })),
    fotos: [...producto.producto_imagenes].sort((a, b) => a.orden - b.orden),
  };

  const aviso = avisoSoloTemporada(
    (temporadas ?? []).map((t) => ({
      nombre: t.tematicas ? nombreEnFrase(t.tematicas.slug, t.tematicas.nombre) : "una temática",
      activa: t.tematica_id === activa?.id,
    })),
  );

  return (
    <>
      <EncabezadoPanel
        titulo={producto.nombre}
        volver={{ ruta: "/admin/contenido/productos", nombre: "Productos" }}
        accion={
          sesion.rol === "superadmin" || sesion.rol === "administrador" ? (
            <EnlaceHistorial de="producto" id={producto.id} />
          ) : null
        }
      />
      {aviso ? (
        <p className="bg-muted mb-4 rounded-md px-4 py-3 text-sm font-semibold">{aviso}</p>
      ) : null}
      <FormularioProducto producto={editable} categorias={categorias ?? []} />
    </>
  );
}
