import * as z from "zod";

import { casilla, json, texto, textoOpcional } from "@/lib/panel/formulario";
import { generarSlug } from "@/lib/utilidades/slug";

export const UNIDADES_DE_VENTA = [
  "unidad",
  "docena",
  "kilo",
  "bolsa",
  "paquete",
  "botella",
] as const;

export const NOMBRE_DE_UNIDAD: Record<(typeof UNIDADES_DE_VENTA)[number], string> = {
  unidad: "Unidad",
  docena: "Docena",
  kilo: "Kilo",
  bolsa: "Bolsa",
  paquete: "Paquete",
  botella: "Botella",
};

/**
 * Lo que escribe una persona en un celular: «0,40», «S/ 0.40», «s/.2».
 * Se queda como TEXTO: la base lo convierte a numeric(12,4) sin pasar nunca
 * por un número de coma flotante.
 */
export function normalizarPrecio(valor: string): string {
  return valor
    .trim()
    .replace(/^s\/\.?\s*/i, "")
    .replace(",", ".")
    .trim();
}

const esquemaPresentacion = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .trim()
    .min(1, { error: "Escribe el nombre de cada presentación, por ejemplo «Unidad»." })
    .max(60, { error: "Máximo 60 letras por presentación." }),
  precio: z
    .string()
    .transform(normalizarPrecio)
    .pipe(
      z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, {
        error: "Escribe el precio con números, por ejemplo 0.40.",
      }),
    ),
  unidad_venta: z.enum(UNIDADES_DE_VENTA, { error: "Elige la unidad de venta." }),
});

export const esquemaProducto = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .min(1, { error: "Escribe el nombre del producto." })
    .max(80, { error: "Máximo 80 letras." })
    .refine((n) => generarSlug(n).length > 0, {
      error: "El nombre necesita al menos una letra o un número.",
    }),
  categoria_id: z.uuid({ error: "Elige una categoría." }),
  descripcion: z.string().max(500, { error: "Máximo 500 letras." }).nullable(),
  destacado: z.boolean(),
  publicado: z.boolean(),
  presentaciones: z
    .array(esquemaPresentacion)
    .min(1, { error: "Añade al menos una presentación con su precio." })
    .refine((lista) => new Set(lista.map((p) => p.nombre.toLowerCase())).size === lista.length, {
      error: "Hay dos presentaciones con el mismo nombre.",
    }),
});

export type DatosProducto = z.infer<typeof esquemaProducto>;

export function leerProducto(fd: FormData) {
  const presentaciones = json(fd, "presentaciones");
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    categoria_id: texto(fd, "categoria_id"),
    descripcion: textoOpcional(fd, "descripcion"),
    destacado: casilla(fd, "destacado"),
    publicado: casilla(fd, "publicado"),
    presentaciones: Array.isArray(presentaciones) ? presentaciones : [],
  };
}

export function validarProducto(fd: FormData) {
  const r = esquemaProducto.safeParse(leerProducto(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
