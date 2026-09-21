"use server";

import * as z from "zod";

import { exigirAcceso } from "@/lib/auth/sesion";
import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaProducto, leerProducto } from "@/lib/validaciones/producto";

const RUTA = "/admin/contenido/productos";
const ETIQUETAS_CATALOGO = [ETIQUETAS.catalogo] as const;

export async function guardarProducto(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaProducto,
    entrada: leerProducto(fd),
    entidad: "un producto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: (d) =>
      d.publicado
        ? "Guardado. Ya se ve en el sitio."
        : "Guardado como borrador. Aún no se ve en el sitio.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("guardar_producto", {
        p_producto: {
          id: d.id,
          categoria_id: d.categoria_id,
          nombre: d.nombre,
          slug: d.id ? undefined : generarSlug(d.nombre),
          descripcion: d.descripcion,
          destacado: d.destacado,
          estado: d.publicado ? "publicado" : "borrador",
        },
        p_presentaciones: d.presentaciones,
      });
      return { error, id: data ?? undefined };
    },
  });
}

export async function borrarProducto(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el producto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Producto borrado.",
    hacer: async ({ id }, { supabase }) => {
      const { error } = await supabase
        .from("productos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}

const esquemaFoto = z.object({
  producto_id: z.uuid(),
  ruta: z.string().min(1),
  alt: z.string().trim().min(1, { error: "Describe la foto en pocas palabras." }).max(120),
});

/** Añade una foto ya subida (o una suelta del bucket). La primera es la principal. */
export async function agregarFotoProducto(
  productoId: string,
  ruta: string,
  alt: string,
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaFoto,
    entrada: { producto_id: productoId, ruta, alt },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Foto añadida.",
    hacer: async (d, { supabase }) => {
      const { count, error: errorCuenta } = await supabase
        .from("producto_imagenes")
        .select("id", { count: "exact", head: true })
        .eq("producto_id", d.producto_id);
      if (errorCuenta) return { error: errorCuenta };
      const { error } = await supabase.from("producto_imagenes").insert({
        producto_id: d.producto_id,
        ruta: d.ruta,
        alt: d.alt,
        orden: count ?? 0,
        es_principal: (count ?? 0) === 0,
      });
      return { error };
    },
  });
}

export async function marcarFotoPrincipal(
  productoId: string,
  fotoId: string,
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ producto_id: z.uuid(), foto_id: z.uuid() }),
    entrada: { producto_id: productoId, foto_id: fotoId },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Esa es ahora la foto principal.",
    hacer: async (d, { supabase }) => {
      // Primero se quita la marca: el índice único parcial no admite dos
      // principales ni por un instante.
      const quitar = await supabase
        .from("producto_imagenes")
        .update({ es_principal: false })
        .eq("producto_id", d.producto_id)
        .eq("es_principal", true);
      if (quitar.error) return { error: quitar.error };
      const { error } = await supabase
        .from("producto_imagenes")
        .update({ es_principal: true })
        .eq("id", d.foto_id)
        .select("id")
        .single();
      return { error };
    },
  });
}

export async function cambiarTextoFoto(fotoId: string, alt: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ foto_id: z.uuid(), alt: esquemaFoto.shape.alt }),
    entrada: { foto_id: fotoId, alt },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Texto de la foto guardado.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("producto_imagenes")
        .update({ alt: d.alt })
        .eq("id", d.foto_id)
        .select("id")
        .single();
      return { error };
    },
  });
}

export async function quitarFotoProducto(fotoId: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ foto_id: z.uuid() }),
    entrada: { foto_id: fotoId },
    entidad: "la foto",
    etiquetas: ETIQUETAS_CATALOGO,
    mensajeOk: "Foto quitada.",
    hacer: async ({ foto_id }, { supabase }) => {
      const { data: foto, error } = await supabase
        .from("producto_imagenes")
        .delete()
        .eq("id", foto_id)
        .select("ruta")
        .single();
      if (error) return { error };

      // El archivo solo se borra si ninguna otra fila lo usa: una foto suelta
      // asignada a dos productos no desaparece de los dos por quitarla de uno.
      const { count } = await supabase
        .from("producto_imagenes")
        .select("id", { count: "exact", head: true })
        .eq("ruta", foto.ruta);
      if (!count && !foto.ruta.startsWith("/") && !foto.ruta.startsWith("http")) {
        await supabase.storage.from("productos").remove([foto.ruta]);
      }
      return { error: null };
    },
  });
}

/** Archivos de la raíz del bucket que no usa ningún producto: las fotos sueltas de la semilla. */
export async function listarFotosSueltas(): Promise<string[]> {
  await exigirAcceso(RUTA);
  const supabase = await crearClienteServidor();

  const [{ data: archivos }, { data: usadas }] = await Promise.all([
    supabase.storage.from("productos").list("", { limit: 500 }),
    supabase.from("producto_imagenes").select("ruta"),
  ]);
  const enUso = new Set((usadas ?? []).map((u) => u.ruta));
  return (
    (archivos ?? [])
      // Las carpetas vienen con id null.
      .filter((a) => a.id !== null && !enUso.has(a.name))
      .map((a) => a.name)
  );
}
