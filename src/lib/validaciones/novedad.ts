import * as z from "zod";

import { TIPOS_DE_NOVEDAD } from "@/lib/panel/aprobacion";
import { texto, textoOpcional } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";
import { generarSlug } from "@/lib/utilidades/slug";

export const esquemaNovedad = z
  .object({
    id: z.uuid().nullable(),
    intencion: z.enum(["guardar", "enviar", "publicar", "devolver", "archivar"]),
    tipo: z.enum(TIPOS_DE_NOVEDAD, { error: "Elige de qué tipo es." }),
    titulo: z
      .string()
      .min(1, { error: "Escribe el título." })
      .max(90, { error: "Máximo 90 letras." })
      .refine((t) => generarSlug(t).length > 0, {
        error: "El título necesita al menos una letra o un número.",
      }),
    resumen: z.string().max(200, { error: "Máximo 200 letras." }).nullable(),
    contenido: z.string().min(1, { error: "Escribe el texto de la novedad." }).max(4000),
    imagen_url: z.string().nullable(),
    vigencia_inicio: z.iso.datetime().nullable(),
    vigencia_fin: z.iso.datetime().nullable(),
    comentario_revision: z.string().max(500).nullable(),
  })
  .refine((d) => !d.vigencia_inicio || !d.vigencia_fin || d.vigencia_fin > d.vigencia_inicio, {
    path: ["vigencia_fin"],
    error: "La fecha de fin tiene que ser después del inicio.",
  })
  .refine((d) => d.intencion !== "devolver" || Boolean(d.comentario_revision), {
    path: ["comentario_revision"],
    error: "Escribe qué hay que corregir antes de devolverla.",
  });

export function leerNovedad(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    intencion: texto(fd, "intencion") || "guardar",
    tipo: texto(fd, "tipo"),
    titulo: texto(fd, "titulo"),
    resumen: textoOpcional(fd, "resumen"),
    contenido: texto(fd, "contenido"),
    imagen_url: textoOpcional(fd, "imagen_url"),
    vigencia_inicio: limaAUtc(texto(fd, "vigencia_inicio")),
    vigencia_fin: limaAUtc(texto(fd, "vigencia_fin")),
    comentario_revision: textoOpcional(fd, "comentario_revision"),
  };
}

export function validarNovedad(fd: FormData) {
  const r = esquemaNovedad.safeParse(leerNovedad(fd));
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
