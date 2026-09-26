import * as z from "zod";

import { casilla, json, texto } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";

import { cantidadPositiva, precio } from "./numeros";

const vacioANull = (v: string) => (v.trim() === "" ? null : v.trim());

/** `datetime-local` en hora de Iquitos → ISO en UTC. Vacío es «ahora» (lo decide la base). */
const momento = z
  .string()
  // Vacío es null, «ahora». Un texto que no es fecha es undefined, y se rechaza:
  // `limaAUtc` también devuelve null cuando falla, y no hay que confundirlos.
  .transform((v) => (v.trim() === "" ? null : (limaAUtc(v.trim()) ?? undefined)))
  .refine((v) => v !== undefined, { error: "Escribe la fecha y la hora." });

const observacion = z
  .string()
  .trim()
  .min(1, { error: "Escribe una observación, por ejemplo «Todo en buen estado»." })
  .max(300, { error: "Máximo 300 letras." });

const lineaBase = {
  insumo_id: z.uuid({ error: "Elige el insumo." }),
  cantidad: cantidadPositiva("Escribe la cantidad con números, por ejemplo 2 o 1.5."),
  unidad_id: z.uuid({ error: "Elige la unidad." }),
};

const sinRepetir = <L extends { insumo_id: string }>(lineas: L[]) =>
  new Set(lineas.map((l) => l.insumo_id)).size === lineas.length;

export const esquemaLineaIngreso = z.object({
  ...lineaBase,
  precio_unitario: precio("Escribe el precio con números, por ejemplo 150."),
  fecha_vencimiento: z
    .union([z.literal(""), z.iso.date({ error: "Elige la fecha de vencimiento." })])
    .transform((v) => (v === "" ? null : v)),
  codigo_lote: z.string().max(40, { error: "Máximo 40 caracteres." }).transform(vacioANull),
});

export const esquemaIngreso = z.object({
  proveedor_id: z.uuid({ error: "Elige el proveedor." }),
  documento_tipo: z.enum(["boleta", "factura", "guia"], { error: "Elige el tipo de documento." }),
  documento_numero: z
    .string()
    .trim()
    .min(1, { error: "Escribe el número del documento." })
    .max(40, { error: "Máximo 40 caracteres." }),
  ocurrido_en: momento,
  observacion,
  confirmar_repetido: z.boolean(),
  lineas: z
    .array(esquemaLineaIngreso)
    .min(1, { error: "Añade al menos un insumo." })
    .max(30, { error: "Como mucho 30 líneas por documento." })
    .refine(sinRepetir, { error: "Cada insumo va en una sola línea." }),
});

export const esquemaLineaConsumo = z.object(lineaBase);

export const esquemaConsumo = z.object({
  origen_consumo: z.enum(["produccion", "retiro_directo"], { error: "Elige de dónde sale." }),
  destino_lote: z
    .string()
    .trim()
    .min(1, { error: "Escribe para qué fue, por ejemplo «Pan francés»." })
    .max(80, { error: "Máximo 80 letras." }),
  area_turno: z
    .string()
    .trim()
    .min(1, { error: "Escribe el área o el turno." })
    .max(40, { error: "Máximo 40 letras." }),
  observacion,
  ocurrido_en: momento,
  lineas: z
    .array(esquemaLineaConsumo)
    .min(1, { error: "Añade al menos un insumo." })
    .max(30, { error: "Como mucho 30 líneas." })
    .refine(sinRepetir, { error: "Cada insumo va en una sola línea." }),
});

/**
 * Los errores con su ruta completa: `lineas.0.cantidad`. `z.flattenError` los
 * juntaría todos bajo `lineas`, y en un formulario de varias líneas hay que
 * saber cuál marcar en rojo.
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string[]> {
  const errores: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const clave = issue.path.map(String).join(".") || "formulario";
    (errores[clave] ??= []).push(issue.message);
  }
  return errores;
}

export function leerIngreso(fd: FormData) {
  return {
    proveedor_id: texto(fd, "proveedor_id"),
    documento_tipo: texto(fd, "documento_tipo"),
    documento_numero: texto(fd, "documento_numero"),
    ocurrido_en: texto(fd, "ocurrido_en"),
    observacion: texto(fd, "observacion"),
    confirmar_repetido: casilla(fd, "confirmar_repetido"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function leerConsumo(fd: FormData) {
  return {
    origen_consumo: texto(fd, "origen_consumo"),
    destino_lote: texto(fd, "destino_lote"),
    area_turno: texto(fd, "area_turno"),
    observacion: texto(fd, "observacion"),
    ocurrido_en: texto(fd, "ocurrido_en"),
    lineas: json(fd, "lineas") ?? [],
  };
}

export function validarIngreso(fd: FormData) {
  const r = esquemaIngreso.safeParse(leerIngreso(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}

export function validarConsumo(fd: FormData) {
  const r = esquemaConsumo.safeParse(leerConsumo(fd));
  return r.success ? {} : erroresPorCampo(r.error);
}
