"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarSlug } from "@/lib/utilidades/slug";
import { esquemaCategoria, leerCategoria } from "@/lib/validaciones/categoria";

const RUTA = "/admin/contenido/categorias";

export async function guardarCategoria(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaCategoria,
    entrada: leerCategoria(fd),
    entidad: "una categoría",
    etiquetas: [ETIQUETAS.catalogo],
    mensajeOk: (d) =>
      d.publicado
        ? "Guardado. Ya se ve en el sitio."
        : "Guardado como borrador. Aún no se ve en el sitio.",
    hacer: async (d, { supabase }) => {
      const fila = {
        nombre: d.nombre,
        descripcion: d.descripcion,
        imagen_url: d.imagen_url,
        estado: d.publicado ? ("publicado" as const) : ("borrador" as const),
      };
      if (d.id) {
        // `.select().single()`: si la RLS esconde la fila, el update no falla,
        // no toca nada. Pedirla de vuelta convierte ese silencio en PGRST116.
        const { error } = await supabase
          .from("categorias_producto")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      // El slug nace con el nombre y no cambia al renombrar: es la dirección
      // de la categoría, y cambiarla rompería los enlaces ya compartidos.
      const { data, error } = await supabase
        .from("categorias_producto")
        .insert({ ...fila, slug: generarSlug(d.nombre) })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarCategoria(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "la categoría",
    etiquetas: [ETIQUETAS.catalogo],
    mensajeOk: "Categoría borrada.",
    hacer: async ({ id }, { supabase }) => {
      const { count, error: errorCuenta } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true })
        .eq("categoria_id", id)
        .is("deleted_at", null);
      if (errorCuenta) return { error: errorCuenta };
      if (count && count > 0) {
        return {
          error: {
            code: "P0001",
            message: `Tiene ${count} ${count === 1 ? "producto" : "productos"}. Pásalos a otra categoría antes de borrarla.`,
          },
        };
      }
      const { error } = await supabase
        .from("categorias_producto")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
