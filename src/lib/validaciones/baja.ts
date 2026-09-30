import * as z from "zod";

import { json, texto } from "@/lib/panel/formulario";

import { erroresPorCampo, esquemaLineaConsumo } from "./movimiento";

export const MOTIVOS = [
  "merma",
  "vencimiento",
  "danado",
  "devolucion_proveedor",
  "consumo_interno",
] as const;

export const esquemaBaja = z.object({
  motivo_baja: z.enum(MOTIVOS, { error: "Elige el motivo." }),
  observacion: z
    .string()
    .trim()
    .min(1, { error: "Cuenta qué pasó, por ejemplo «Se mojó un saco»." })
    .max(300, { error: "Máximo 300 letras." }),
  lineas: z
    .array(
      esquemaLineaConsumo.extend({
        // De qué lote sale (decisión 3 de Dan, 25/09/2026). Opcional: sin él,
        // la base saca del que vence primero (FEFO). La base comprueba además
        // que el lote sea de ese insumo.
        lote_id: z
          .union([z.uuid({ error: "Elige un lote de la lista." }), z.literal("")])
          .optional()
          .transform((v) => (v ? v : null)),
      }),
    )
    .length(1, { error: "Elige un insumo." }),
});

export function leerBaja(fd: FormData) {
  return {
    motivo_baja: texto(fd, "motivo_baja"),
    observacion: texto(fd, "observacion"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function validarBaja(fd: FormData) {
  const r = esquemaBaja.safeParse(leerBaja(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
