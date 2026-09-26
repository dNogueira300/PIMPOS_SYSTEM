import * as z from "zod";

import { json, texto } from "@/lib/panel/formulario";

import { cantidadOCero, precioOpcional } from "./numeros";

export const esquemaConteo = z.object({
  observacion: z
    .string()
    .trim()
    .min(1, { error: "Escribe por qué se contó, por ejemplo «Inventario inicial»." })
    .max(300, { error: "Máximo 300 letras." }),
  lineas: z
    .array(
      z.object({
        insumo_id: z.uuid(),
        contado: cantidadOCero("Escribe lo contado con números, por ejemplo 12.5."),
        precio_unitario: precioOpcional("Escribe el precio con números, por ejemplo 3.20."),
        fecha_vencimiento: z
          .union([z.literal(""), z.iso.date()])
          .transform((v) => (v === "" ? null : v)),
      }),
    )
    .min(1, { error: "Escribe lo contado en al menos un insumo." }),
});

type LineaCruda = { contado?: unknown };

export function leerConteo(fd: FormData) {
  const lineas = json(fd, "lineas");
  return {
    observacion: texto(fd, "observacion"),
    // Un insumo sin nada escrito no se contó: no es un «0».
    lineas: Array.isArray(lineas)
      ? lineas.filter((l: LineaCruda) => typeof l.contado === "string" && l.contado.trim() !== "")
      : [],
  };
}

export function validarConteo(fd: FormData) {
  const r = esquemaConteo.safeParse(leerConteo(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
