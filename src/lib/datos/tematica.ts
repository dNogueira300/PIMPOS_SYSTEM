import { cacheLife, cacheTag } from "next/cache";

import { hoyEnLima } from "@/lib/insumos/periodo";
import { crearClientePublico } from "@/lib/supabase/publico";
import { textoCuentaRegresiva } from "@/lib/tematicas/cuenta-regresiva";
import { esSlugConDiseno, type SlugConDiseno } from "@/lib/tematicas/disenos";
import { comoEstilo, type Estilo } from "@/lib/tematicas/estilos";

import { avisarDeConsulta } from "./aviso";
import { COLUMNAS, aProducto, type ProductoPublico } from "./catalogo";
import { ETIQUETAS } from "./etiquetas";

/**
 * La temática de temporada activa, para el sitio público (plan 08, T4).
 *
 * Cuál está activa lo decide la base (`app.tematica_activa_id`, 0047): aquí
 * solo se lee la vista `tematica_publica`, que trae una fila o ninguna. Caduca
 * cada hora para que el sitio se encienda y se apague solo en su fecha, y el
 * panel la refresca al guardar (etiquetas `marca` y `catalogo`).
 */

export type TematicaPublica = {
  /** Solo las que tienen diseño en el código (`disenos.ts`): otra no viste el sitio. */
  slug: SlugConDiseno;
  estilo: Estilo;
  nombre: string;
  fechaEvento: string | null;
  textoAviso: string | null;
  mensajes: string[];
  titulo: string | null;
  entradilla: string | null;
};

export async function obtenerTematicaActiva(): Promise<TematicaPublica | null> {
  "use cache";
  cacheTag(ETIQUETAS.marca);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("tematica_publica")
    .select("slug, estilo, nombre, fecha_evento, texto_aviso, mensajes_cinta, titulo, entradilla")
    .limit(1)
    .maybeSingle();
  if (error) {
    avisarDeConsulta("tematica_publica", error);
    return null;
  }
  if (!data || !esSlugConDiseno(data.slug)) return null;
  const slug = data.slug;

  return {
    slug,
    estilo: comoEstilo(slug, data.estilo),
    nombre: data.nombre ?? "",
    fechaEvento: data.fecha_evento,
    textoAviso: data.texto_aviso,
    mensajes: (data.mensajes_cinta ?? []).filter((m) => m.trim() !== ""),
    titulo: data.titulo,
    entradilla: data.entradilla,
  };
}

/** Los productos de la sección de temporada, en su orden; como mucho 8. */
export async function listarProductosDeTemporada(): Promise<ProductoPublico[]> {
  "use cache";
  cacheTag(ETIQUETAS.catalogo);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("productos_de_temporada")
    .select(COLUMNAS)
    .order("orden_temporada", { ascending: true })
    .limit(8);
  if (error || !data) {
    avisarDeConsulta("productos_de_temporada", error);
    return [];
  }
  return data.map(aProducto);
}

/**
 * La cuenta regresiva de hoy. Va en su propia función con caché porque usa el
 * reloj: suelto, `new Date()` rompe el prerenderizado con Cache Components.
 */
export async function cuentaRegresivaDeHoy(
  fechaEvento: string,
  evento: string,
): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  return textoCuentaRegresiva(fechaEvento, hoyEnLima(new Date()), evento);
}
