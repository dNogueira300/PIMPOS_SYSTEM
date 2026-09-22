"use server";

import * as z from "zod";

import { ETIQUETAS } from "@/lib/datos/etiquetas";
import { ejecutarAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarSlug } from "@/lib/utilidades/slug";
import {
  esquemaFaq,
  esquemaFotoGaleria,
  esquemaGuia,
  esquemaSlide,
  esquemaTestimonio,
  leerFaq,
  leerFotoGaleria,
  leerGuia,
  leerSlide,
  leerTestimonio,
} from "@/lib/validaciones/contenido";

const estado = (publicado: boolean) => (publicado ? ("publicado" as const) : ("borrador" as const));
const mensajeGuardado = (d: { publicado: boolean }) =>
  d.publicado
    ? "Guardado. Ya se ve en el sitio."
    : "Guardado como borrador. Aún no se ve en el sitio.";
const ahora = () => new Date().toISOString();

// --- Portada -----------------------------------------------------------------

export async function guardarSlide(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/portada",
    esquema: esquemaSlide,
    entrada: leerSlide(fd),
    entidad: "un slide",
    etiquetas: [ETIQUETAS.novedades],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        // `.select().single()`: si la RLS esconde la fila, el update no falla,
        // no toca nada. Pedirla de vuelta convierte ese silencio en PGRST116.
        const { error } = await supabase
          .from("slides")
          .update(fila)
          .eq("id", id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("slides").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarSlide(id: string): Promise<EstadoAccion> {
  return borrarLogico("slides", id, "/admin/contenido/portada", "el slide", ETIQUETAS.novedades);
}

// --- Galería -----------------------------------------------------------------

export async function guardarFotoGaleria(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/galeria",
    esquema: esquemaFotoGaleria,
    entrada: leerFotoGaleria(fd),
    entidad: "una foto",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("galeria")
          .update(fila)
          .eq("id", id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("galeria").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarFotoGaleria(id: string): Promise<EstadoAccion> {
  return borrarLogico("galeria", id, "/admin/contenido/galeria", "la foto", ETIQUETAS.contenido);
}

// --- Preguntas frecuentes ----------------------------------------------------

export async function guardarFaq(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/preguntas",
    esquema: esquemaFaq,
    entrada: leerFaq(fd),
    entidad: "una pregunta",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("faqs")
          .update(fila)
          .eq("id", id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("faqs").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarFaq(id: string): Promise<EstadoAccion> {
  return borrarLogico("faqs", id, "/admin/contenido/preguntas", "la pregunta", ETIQUETAS.contenido);
}

// --- Guías -------------------------------------------------------------------

export async function guardarGuia(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/guias",
    esquema: esquemaGuia,
    entrada: leerGuia(fd),
    entidad: "una guía",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("guias")
          .update(fila)
          .eq("id", id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id };
      }
      // El slug nace con el título y no cambia al renombrar: es la dirección
      // de la guía, y cambiarla rompería los enlaces ya compartidos.
      const { data, error } = await supabase
        .from("guias")
        .insert({ ...fila, slug: generarSlug(d.titulo) })
        .select("id")
        .single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarGuia(id: string): Promise<EstadoAccion> {
  return borrarLogico("guias", id, "/admin/contenido/guias", "la guía", ETIQUETAS.contenido);
}

// --- Testimonios -------------------------------------------------------------

export async function guardarTestimonio(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: "/admin/contenido/testimonios",
    esquema: esquemaTestimonio,
    entrada: leerTestimonio(fd),
    entidad: "un testimonio",
    etiquetas: [ETIQUETAS.contenido],
    mensajeOk: mensajeGuardado,
    hacer: async ({ id, publicado, ...d }, { supabase }) => {
      // Un testimonio escrito desde el panel es real por definición: es_demo
      // se queda en false (valor por defecto) y no se ofrece en el formulario.
      const fila = { ...d, estado: estado(publicado) };
      if (id) {
        const { error } = await supabase
          .from("testimonios")
          .update(fila)
          .eq("id", id)
          .is("deleted_at", null)
          .select("id")
          .single();
        return { error, id };
      }
      const { data, error } = await supabase.from("testimonios").insert(fila).select("id").single();
      return { error, id: data?.id };
    },
  });
}

export async function borrarTestimonio(id: string): Promise<EstadoAccion> {
  return borrarLogico(
    "testimonios",
    id,
    "/admin/contenido/testimonios",
    "el testimonio",
    ETIQUETAS.contenido,
  );
}

// --- Borrado lógico común ----------------------------------------------------

async function borrarLogico(
  tabla: "slides" | "galeria" | "faqs" | "guias" | "testimonios",
  id: string,
  ruta: string,
  entidad: string,
  etiqueta: (typeof ETIQUETAS)[keyof typeof ETIQUETAS],
): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad,
    etiquetas: [etiqueta],
    mensajeOk: "Borrado.",
    hacer: async ({ id }, { supabase }) => {
      const cambio = { deleted_at: ahora() };
      // Una rama por tabla: ver la nota de `moverFila` en `acciones/orden.ts`.
      const consulta =
        tabla === "slides"
          ? supabase.from("slides").update(cambio).eq("id", id).select("id").single()
          : tabla === "galeria"
            ? supabase.from("galeria").update(cambio).eq("id", id).select("id").single()
            : tabla === "faqs"
              ? supabase.from("faqs").update(cambio).eq("id", id).select("id").single()
              : tabla === "guias"
                ? supabase.from("guias").update(cambio).eq("id", id).select("id").single()
                : supabase.from("testimonios").update(cambio).eq("id", id).select("id").single();
      const { error } = await consulta;
      return { error };
    },
  });
}
