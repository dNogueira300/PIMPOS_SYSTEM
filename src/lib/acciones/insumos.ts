"use server";

import * as z from "zod";

import { RUTA_INSUMOS } from "@/lib/insumos/rutas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaInsumo, leerInsumo } from "@/lib/validaciones/insumo";

export async function guardarInsumo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: esquemaInsumo,
    entrada: leerInsumo(fd),
    entidad: "un insumo",
    // Insumos no se ve en el sitio público: no hay nada que refrescar.
    etiquetas: [],
    mensajeOk: "Insumo guardado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("guardar_insumo", {
        p_insumo: {
          id: d.id,
          nombre: d.nombre,
          descripcion: d.descripcion,
          unidad_base_id: d.unidad_base_id,
          presentacion: d.presentacion,
          stock_minimo: d.stock_minimo,
          es_perecible: d.es_perecible,
          proveedor_habitual_id: d.proveedor_habitual_id,
        },
        p_equivalencias: d.equivalencias,
      });
      return { error, id: data ?? undefined };
    },
  });
}

/** Retirar, no borrar: sus movimientos siguen contando la historia. */
export async function retirarInsumo(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el insumo",
    etiquetas: [],
    mensajeOk: "Insumo retirado. Ya no aparece en Existencias.",
    hacer: async ({ id }, { supabase }) => {
      const { data: existencia, error: errorLectura } = await supabase
        .from("existencias_insumo")
        .select("cantidad_base, unidad_base")
        .eq("id", id)
        .single();
      if (errorLectura) return { error: errorLectura };
      if (Number(existencia.cantidad_base) > 0) {
        return {
          error: {
            code: "P0001",
            message: `Todavía quedan ${existencia.cantidad_base} ${existencia.unidad_base}. Pide su baja o haz un conteo antes de retirarlo.`,
          },
        };
      }
      const { error } = await supabase
        .from("insumos")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", id)
        .select("id")
        .single();
      return { error };
    },
  });
}
