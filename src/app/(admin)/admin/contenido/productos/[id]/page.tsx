import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

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
  await exigirAcceso("/admin/contenido/productos");
  const supabase = await crearClienteServidor();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, nombre, categoria_id, descripcion, destacado, estado, producto_variantes(id, nombre, precio, unidad_venta, orden, deleted_at), producto_imagenes(id, ruta, alt, es_principal, orden)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("categorias_producto").select("id, nombre").is("deleted_at", null).order("orden"),
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

  return (
    <>
      <EncabezadoPanel
        titulo={producto.nombre}
        volver={{ ruta: "/admin/contenido/productos", nombre: "Productos" }}
      />
      <FormularioProducto producto={editable} categorias={categorias ?? []} />
    </>
  );
}
