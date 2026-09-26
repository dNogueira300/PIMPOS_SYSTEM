"use server";

import * as z from "zod";

import { RUTA_INSUMOS } from "@/lib/insumos/rutas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { esquemaConteo, leerConteo } from "@/lib/validaciones/conteo";

export async function registrarConteo(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: `${RUTA_INSUMOS}/conteo`,
    esquema: esquemaConteo,
    entrada: leerConteo(fd),
    entidad: "un conteo",
    etiquetas: [],
    mensajeOk: "Conteo registrado.",
    hacer: async (d, { supabase }) => {
      const { data, error } = await supabase.rpc("registrar_conteo", {
        p_lineas: d.lineas,
        p_observacion: d.observacion,
      });
      const mensaje =
        data === 0
          ? "Todo coincide: no hizo falta ningún ajuste."
          : `Conteo registrado: ${data} ${data === 1 ? "ajuste" : "ajustes"}.`;
      return { error, mensaje: error ? undefined : mensaje };
    },
  });
}

export async function anularMovimiento(id: string, fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA_INSUMOS,
    esquema: z.object({
      id: z.uuid(),
      motivo: z
        .string()
        .trim()
        .min(1, { error: "Escribe por qué se anula." })
        .max(300, { error: "Máximo 300 letras." }),
    }),
    entrada: { id, motivo: fd.get("motivo") ?? "" },
    entidad: "el registro",
    etiquetas: [],
    mensajeOk: "Registro anulado. Se ve tachado en el kárdex.",
    hacer: async ({ id, motivo }, { supabase }) => {
      const { data, error } = await supabase.rpc("anular_movimiento", {
        p_id: id,
        p_motivo: motivo,
      });
      return { error, id: data ?? undefined };
    },
  });
}
