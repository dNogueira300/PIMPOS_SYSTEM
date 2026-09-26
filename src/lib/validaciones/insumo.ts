import * as z from "zod";

import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";

import { cantidadOCero, cantidadPositiva } from "./numeros";

export const esquemaEquivalencia = z.object({
  unidad_desde_id: z.uuid({ error: "Elige la unidad." }),
  factor: cantidadPositiva("Escribe cuánto trae, por ejemplo 50."),
});

export const esquemaInsumo = z
  .object({
    id: z.uuid().nullable(),
    nombre: z
      .string()
      .trim()
      .min(1, { error: "Escribe el nombre del insumo." })
      .max(80, { error: "Máximo 80 letras." }),
    descripcion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
    unidad_base_id: z.uuid({ error: "Elige en qué unidad se cuenta." }),
    presentacion: z.string().max(80, { error: "Máximo 80 letras." }).nullable(),
    stock_minimo: cantidadOCero("Escribe el mínimo con números, por ejemplo 25."),
    es_perecible: z.boolean(),
    proveedor_habitual_id: z.uuid().nullable(),
    equivalencias: z.array(esquemaEquivalencia).max(10, { error: "Como mucho 10 equivalencias." }),
  })
  .refine(
    (d) => new Set(d.equivalencias.map((e) => e.unidad_desde_id)).size === d.equivalencias.length,
    { error: "Cada unidad va una sola vez.", path: ["equivalencias"] },
  )
  .refine((d) => d.equivalencias.every((e) => e.unidad_desde_id !== d.unidad_base_id), {
    error: "La unidad en la que se cuenta no necesita equivalencia.",
    path: ["equivalencias"],
  });

export type DatosInsumo = z.infer<typeof esquemaInsumo>;

export function leerInsumo(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
    unidad_base_id: texto(fd, "unidad_base_id"),
    presentacion: textoOpcional(fd, "presentacion"),
    stock_minimo: texto(fd, "stock_minimo"),
    es_perecible: casilla(fd, "es_perecible"),
    proveedor_habitual_id: textoOpcional(fd, "proveedor_habitual_id"),
    equivalencias: json(fd, "equivalencias") ?? [],
  };
}

export function validarInsumo(fd: FormData) {
  const r = esquemaInsumo.safeParse(leerInsumo(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
