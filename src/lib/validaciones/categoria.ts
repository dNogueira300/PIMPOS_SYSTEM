import * as z from "zod";

import { casilla, texto, textoOpcional } from "@/lib/panel/formulario";
import { generarSlug } from "@/lib/utilidades/slug";

export const esquemaCategoria = z.object({
  id: z.uuid().nullable(),
  nombre: z
    .string()
    .min(1, { error: "Escribe el nombre de la categoría." })
    .max(60, { error: "Máximo 60 letras." })
    .refine((n) => generarSlug(n).length > 0, {
      error: "El nombre necesita al menos una letra o un número.",
    }),
  descripcion: z.string().max(300, { error: "Máximo 300 letras." }).nullable(),
  imagen_url: z.string().nullable(),
  publicado: z.boolean(),
});

export type DatosCategoria = z.infer<typeof esquemaCategoria>;

export function leerCategoria(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    descripcion: textoOpcional(fd, "descripcion"),
    imagen_url: textoOpcional(fd, "imagen_url"),
    publicado: casilla(fd, "publicado"),
  };
}

/** Para la validación en el navegador: los errores por campo, o vacío. */
export function validarCategoria(fd: FormData) {
  const r = esquemaCategoria.safeParse(leerCategoria(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
