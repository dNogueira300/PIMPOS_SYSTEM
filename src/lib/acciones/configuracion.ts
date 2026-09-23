"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import type { Json } from "@/tipos/database.types";
import {
  CLAVES_EDITABLES,
  esquemaConfiguracionPanel,
  leerConfiguracion,
} from "@/lib/validaciones/configuracion-panel";

export async function guardarConfiguracion(fd: FormData): Promise<EstadoAccion> {
  const { valores, confirmadas } = leerConfiguracion(fd);

  // Se valida aquí y no dentro de `ejecutarAccion`: allí el esquema envolvería
  // los valores (`valores.whatsapp`) y `flattenError`, que solo mira el primer
  // segmento del camino, dejaría todos los errores bajo `valores` en vez de en
  // su campo. `ejecutarAccion` sigue comprobando el acceso antes de escribir.
  const validado = esquemaConfiguracionPanel.safeParse(valores);
  if (!validado.success) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados en rojo.",
      errores: z.flattenError(validado.error).fieldErrors as Record<string, string[] | undefined>,
    };
  }

  return ejecutarAccion({
    ruta: "/admin/configuracion",
    esquema: z.object({
      valores: z.record(z.string(), z.unknown()),
      confirmadas: z.array(z.string().refine((c) => (CLAVES_EDITABLES as string[]).includes(c))),
    }),
    entrada: { valores: validado.data, confirmadas },
    entidad: "la configuración",
    // marca: la cascara pública (cabecera, pie, horario, WhatsApp) y el favicon.
    etiquetas: [ETIQUETAS.marca],
    mensajeOk: "Guardado. El sitio ya muestra los datos nuevos.",
    hacer: async (d, { supabase }) => {
      // `d.valores` sale de `esquemaConfiguracionPanel` (paso arriba): cada
      // clave ya es texto, número, arreglo de texto o un objeto plano de eso
      // mismo, así que es JSON válido. El `z.record(..., z.unknown())` de
      // arriba solo comprueba la forma del objeto; PostgREST serializa igual.
      const { error } = await supabase.rpc("guardar_configuracion", {
        p_valores: d.valores as Json,
        p_confirmadas: d.confirmadas,
      });
      return { error };
    },
  });
}
