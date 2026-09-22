import * as z from "zod";

import { casilla, entero, texto, textoOpcional } from "@/lib/panel/formulario";
import { limaAUtc } from "@/lib/panel/hora-lima";
import { generarSlug } from "@/lib/utilidades/slug";

type Errores = Record<string, string[] | undefined>;
function errores(esquema: z.ZodType, datos: unknown): Errores {
  const r = esquema.safeParse(datos);
  return r.success ? {} : (z.flattenError(r.error).fieldErrors as Errores);
}

// --- Slide de portada --------------------------------------------------------

export const esquemaSlide = z
  .object({
    id: z.uuid().nullable(),
    titulo: z
      .string()
      .min(1, { error: "Escribe el titular." })
      .max(80, { error: "Máximo 80 letras." }),
    subtitulo: z.string().max(160, { error: "Máximo 160 letras." }).nullable(),
    imagen_url: z.string().min(1, { error: "Sube la foto del slide." }),
    imagen_movil_url: z.string().nullable(),
    imagen_alt: z
      .string()
      .min(1, { error: "Describe la foto para quien no puede verla." })
      .max(160),
    enlace_url: z
      .string()
      .regex(/^(\/|https:\/\/)/, { error: "El enlace tiene que empezar por / o por https://" })
      .nullable(),
    texto_boton: z.string().max(30, { error: "Máximo 30 letras." }).nullable(),
    enfoque: z.number({ error: "Elige a qué altura se recorta." }).int().min(0).max(100),
    publicado: z.boolean(),
    vigencia_inicio: z.iso.datetime().nullable(),
    vigencia_fin: z.iso.datetime().nullable(),
  })
  .refine((d) => (d.enlace_url === null) === (d.texto_boton === null), {
    path: ["texto_boton"],
    error: "Si el slide lleva botón, escribe el texto y el enlace.",
  })
  .refine((d) => !d.vigencia_inicio || !d.vigencia_fin || d.vigencia_fin > d.vigencia_inicio, {
    path: ["vigencia_fin"],
    error: "La fecha de fin tiene que ser después del inicio.",
  });

export function leerSlide(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: texto(fd, "titulo"),
    subtitulo: textoOpcional(fd, "subtitulo"),
    imagen_url: texto(fd, "imagen_url"),
    imagen_movil_url: textoOpcional(fd, "imagen_movil_url"),
    imagen_alt: texto(fd, "imagen_alt"),
    enlace_url: textoOpcional(fd, "enlace_url"),
    texto_boton: textoOpcional(fd, "texto_boton"),
    enfoque: entero(fd, "enfoque") ?? 50,
    publicado: casilla(fd, "publicado"),
    vigencia_inicio: limaAUtc(texto(fd, "vigencia_inicio")),
    vigencia_fin: limaAUtc(texto(fd, "vigencia_fin")),
  };
}
export const validarSlide = (fd: FormData) => errores(esquemaSlide, leerSlide(fd));

// --- Foto de galería ---------------------------------------------------------

export const CATEGORIAS_GALERIA = [
  "fachada",
  "interior",
  "atencion",
  "hornos",
  "productos",
] as const;
export const NOMBRE_CATEGORIA_GALERIA: Record<(typeof CATEGORIAS_GALERIA)[number], string> = {
  fachada: "Fachada",
  interior: "Interior",
  atencion: "Atención",
  hornos: "Hornos",
  productos: "Productos",
};

export const esquemaFotoGaleria = z.object({
  id: z.uuid().nullable(),
  titulo: z.string().max(60, { error: "Máximo 60 letras." }).nullable(),
  alt: z.string().min(1, { error: "Describe la foto para quien no puede verla." }).max(160),
  ruta: z.string().min(1, { error: "Sube la foto." }),
  categoria: z.enum(CATEGORIAS_GALERIA, { error: "Elige de qué es la foto." }),
  publicado: z.boolean(),
});

export function leerFotoGaleria(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: textoOpcional(fd, "titulo"),
    alt: texto(fd, "alt"),
    ruta: texto(fd, "ruta"),
    categoria: texto(fd, "categoria"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarFotoGaleria = (fd: FormData) =>
  errores(esquemaFotoGaleria, leerFotoGaleria(fd));

// --- Pregunta frecuente ------------------------------------------------------

export const esquemaFaq = z.object({
  id: z.uuid().nullable(),
  pregunta: z
    .string()
    .min(1, { error: "Escribe la pregunta." })
    .max(160, { error: "Máximo 160 letras." }),
  respuesta: z
    .string()
    .min(1, { error: "Escribe la respuesta." })
    .max(1000, { error: "Máximo 1000 letras." }),
  publicado: z.boolean(),
});

export function leerFaq(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    pregunta: texto(fd, "pregunta"),
    respuesta: texto(fd, "respuesta"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarFaq = (fd: FormData) => errores(esquemaFaq, leerFaq(fd));

// --- Guía --------------------------------------------------------------------

export const esquemaGuia = z.object({
  id: z.uuid().nullable(),
  titulo: z
    .string()
    .min(1, { error: "Escribe el título." })
    .max(90, { error: "Máximo 90 letras." })
    .refine((t) => generarSlug(t).length > 0, {
      error: "El título necesita al menos una letra o un número.",
    }),
  resumen: z.string().max(200, { error: "Máximo 200 letras." }).nullable(),
  contenido: z.string().min(1, { error: "Escribe el texto de la guía." }).max(4000),
  publicado: z.boolean(),
});

export function leerGuia(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    titulo: texto(fd, "titulo"),
    resumen: textoOpcional(fd, "resumen"),
    contenido: texto(fd, "contenido"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarGuia = (fd: FormData) => errores(esquemaGuia, leerGuia(fd));

// --- Testimonio --------------------------------------------------------------

export const esquemaTestimonio = z.object({
  id: z.uuid().nullable(),
  nombre: z.string().min(1, { error: "Escribe el nombre de quien lo dice." }).max(60),
  texto: z
    .string()
    .min(1, { error: "Escribe lo que dijo." })
    .max(400, { error: "Máximo 400 letras." }),
  procedencia: z.string().max(60, { error: "Máximo 60 letras." }).nullable(),
  publicado: z.boolean(),
});

export function leerTestimonio(fd: FormData) {
  return {
    id: textoOpcional(fd, "id"),
    nombre: texto(fd, "nombre"),
    texto: texto(fd, "texto"),
    procedencia: textoOpcional(fd, "procedencia"),
    publicado: casilla(fd, "publicado"),
  };
}
export const validarTestimonio = (fd: FormData) => errores(esquemaTestimonio, leerTestimonio(fd));
