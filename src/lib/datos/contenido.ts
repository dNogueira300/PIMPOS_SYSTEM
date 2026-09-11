import { cacheLife, cacheTag } from "next/cache";

import { crearClientePublico, urlDeImagen } from "@/lib/supabase/publico";

import { ETIQUETAS } from "./etiquetas";

/**
 * Contenido editorial del sitio: carrusel, novedades, galeria, faqs,
 * testimonios y guias. Todo desde vistas (migracion 0016).
 */

export type Slide = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagen: string | null;
  imagenMovil: string | null;
  alt: string;
  enlace: string | null;
  textoBoton: string | null;
  /** Por que altura se encuadra la foto al recortarla: 0 arriba, 100 abajo. */
  enfoque: number;
};

export type Novedad = {
  id: string;
  tipo: string;
  titulo: string;
  slug: string;
  resumen: string | null;
  contenido: string;
  imagen: string | null;
  vigenciaFin: string | null;
};

export type FotoGaleria = {
  id: string;
  titulo: string | null;
  alt: string;
  imagen: string | null;
  categoria: string;
};

export type Faq = { id: string; pregunta: string; respuesta: string };
export type Testimonio = {
  id: string;
  nombre: string;
  texto: string;
  procedencia: string | null;
};
export type Guia = {
  id: string;
  titulo: string;
  slug: string;
  resumen: string | null;
  contenido: string;
};

export async function listarSlides(): Promise<Slide[]> {
  "use cache";
  cacheTag(ETIQUETAS.novedades);
  // Los slides tienen vigencia: uno que caduca a medianoche no puede quedarse
  // un dia entero en la portada por culpa del cache.
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("slides_publicos")
    .select(
      "id, titulo, subtitulo, imagen_url, imagen_movil_url, imagen_alt, enlace_url, texto_boton, orden, enfoque",
    )
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    titulo: fila.titulo ?? "",
    subtitulo: fila.subtitulo,
    imagen: urlDeImagen("slides", fila.imagen_url),
    imagenMovil: urlDeImagen("slides", fila.imagen_movil_url),
    // Sin alt util, la foto es decorativa y el lector de pantalla la salta.
    // Repetir el titulo seria peor: lo acaba de leer.
    alt: fila.imagen_alt ?? "",
    enlace: fila.enlace_url,
    textoBoton: fila.texto_boton,
    // Centrado si la fila no lo trae: es como se encuadraba antes de 0020.
    enfoque: fila.enfoque ?? 50,
  }));
}

export async function listarNovedades(cuantas?: number): Promise<Novedad[]> {
  "use cache";
  cacheTag(ETIQUETAS.novedades);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("novedades_publicas")
    .select("id, tipo, titulo, slug, resumen, contenido, imagen_url, vigencia_fin, publicada_en")
    .order("publicada_en", { ascending: false });

  if (error || !data) return [];
  const novedades = data.map((fila) => ({
    id: fila.id ?? "",
    tipo: fila.tipo ?? "aviso",
    titulo: fila.titulo ?? "",
    slug: fila.slug ?? "",
    resumen: fila.resumen,
    contenido: fila.contenido ?? "",
    imagen: urlDeImagen("slides", fila.imagen_url),
    vigenciaFin: fila.vigencia_fin,
  }));
  return cuantas === undefined ? novedades : novedades.slice(0, cuantas);
}

export async function obtenerNovedad(slug: string): Promise<Novedad | null> {
  const novedades = await listarNovedades();
  return novedades.find((n) => n.slug === slug) ?? null;
}

export async function listarGaleria(): Promise<FotoGaleria[]> {
  "use cache";
  cacheTag(ETIQUETAS.contenido);
  cacheLife("days");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("galeria_publica")
    .select("id, titulo, alt, ruta, categoria, orden")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    titulo: fila.titulo,
    alt: fila.alt ?? fila.titulo ?? "",
    imagen: urlDeImagen("galeria", fila.ruta),
    categoria: fila.categoria ?? "fachada",
  }));
}

export async function listarFaqs(): Promise<Faq[]> {
  "use cache";
  cacheTag(ETIQUETAS.contenido);
  cacheLife("days");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("faqs_publicas")
    .select("id, pregunta, respuesta, orden")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    pregunta: fila.pregunta ?? "",
    respuesta: fila.respuesta ?? "",
  }));
}

export async function listarTestimonios(): Promise<Testimonio[]> {
  "use cache";
  cacheTag(ETIQUETAS.contenido);
  cacheLife("days");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("testimonios_publicos")
    .select("id, nombre, texto, procedencia, orden")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    nombre: fila.nombre ?? "",
    texto: fila.texto ?? "",
    procedencia: fila.procedencia,
  }));
}

export async function listarGuias(): Promise<Guia[]> {
  "use cache";
  cacheTag(ETIQUETAS.contenido);
  cacheLife("days");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("guias_publicas")
    .select("id, titulo, slug, resumen, contenido, orden")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    titulo: fila.titulo ?? "",
    slug: fila.slug ?? "",
    resumen: fila.resumen,
    contenido: fila.contenido ?? "",
  }));
}
