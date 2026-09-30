"use server";

import * as z from "zod";

import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaZona, leerZona } from "@/lib/validaciones/zona";

const RUTA = "/admin/clientes/zonas";

export async function guardarZona(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaZona,
    entrada: leerZona(fd),
    entidad: "una zona", // 23505 → «Ya hay una zona con ese nombre» (índice lower(nombre) de 0013)
    etiquetas: [],
    mensajeOk: "Zona guardada.",
    hacer: async (d, { supabase }) => {
      const fila = { nombre: d.nombre, descripcion: d.descripcion };
      if (d.id) {
        const { error } = await supabase
          .from("zonas_reparto")
          .update(fila)
          .eq("id", d.id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id: d.id };
      }
      // Al final de la lista: el orden lo cambian las flechas.
      const { data: ultima } = await supabase
        .from("zonas_reparto")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("zonas_reparto")
        .insert({ ...fila, orden: (ultima?.orden ?? 0) + 1 })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

/** Retirar una zona con clientes activos lo impide la base (0042) con la frase de qué hacer. */
export async function cambiarActivaZona(id: string, activa: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid(), activa: z.boolean() }),
    entrada: { id, activa },
    entidad: "la zona",
    etiquetas: [],
    mensajeOk: activa ? "Zona activada." : "Zona retirada. Ya no se ofrece al registrar clientes.",
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("zonas_reparto")
        .update({ activo: d.activa })
        .eq("id", d.id)
        .select("id")
        .single();
      return { error };
    },
  });
}
