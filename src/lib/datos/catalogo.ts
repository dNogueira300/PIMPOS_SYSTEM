import { cacheLife, cacheTag } from "next/cache";

import { crearClientePublico, urlDeImagen } from "@/lib/supabase/publico";

import { ETIQUETAS } from "./etiquetas";

/**
 * Lecturas del catalogo publico.
 *
 * Todas consultan VISTAS, nunca tablas (migracion 0016). Ninguna de estas
 * funciones filtra por estado: eso ya lo hace la vista, y ademas la RLS niega
 * los borradores a la llave anonima. Si alguna vez apareciera un borrador aqui,
 * el fallo estaria en la base, no en esta capa.
 */

export type ProductoPublico = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  destacado: boolean;
  categoriaNombre: string | null;
  categoriaSlug: string | null;
  precioDesde: number | null;
  precioHasta: number | null;
  variantes: number;
  varianteNombre: string | null;
  varianteUnidad: string | null;
  imagen: string | null;
  imagenAlt: string | null;
};

export type CategoriaPublica = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
};

// `numeric` de Postgres llega como string por JSON: perder centimos en un
// catalogo que empieza en S/ 0.10 seria caro. Se convierte aqui, una vez.
function aNumero(valor: string | number | null): number | null {
  if (valor === null) return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

type FilaProducto = {
  id: string | null;
  nombre: string | null;
  slug: string | null;
  descripcion: string | null;
  destacado: boolean | null;
  categoria_nombre: string | null;
  categoria_slug: string | null;
  precio_desde: string | number | null;
  precio_hasta: string | number | null;
  variantes: number | null;
  variante_nombre: string | null;
  variante_unidad: string | null;
  imagen_ruta: string | null;
  imagen_alt: string | null;
};

function aProducto(fila: FilaProducto): ProductoPublico {
  return {
    id: fila.id ?? "",
    nombre: fila.nombre ?? "",
    slug: fila.slug ?? "",
    descripcion: fila.descripcion,
    destacado: fila.destacado ?? false,
    categoriaNombre: fila.categoria_nombre,
    categoriaSlug: fila.categoria_slug,
    precioDesde: aNumero(fila.precio_desde),
    precioHasta: aNumero(fila.precio_hasta),
    variantes: fila.variantes ?? 0,
    varianteNombre: fila.variante_nombre,
    varianteUnidad: fila.variante_unidad,
    imagen: urlDeImagen("productos", fila.imagen_ruta),
    imagenAlt: fila.imagen_alt,
  };
}

// Una sola cadena literal, sin concatenar: supabase-js deduce el tipo de la
// fila a partir del texto del `select`, y un `"a" + "b"` le llega como `string`
// generico, que rompe la inferencia y deja el resultado sin tipar.
const COLUMNAS =
  "id, nombre, slug, descripcion, destacado, categoria_nombre, categoria_slug, precio_desde, precio_hasta, variantes, variante_nombre, variante_unidad, imagen_ruta, imagen_alt, orden, categoria_orden" as const;

export async function listarProductos(): Promise<ProductoPublico[]> {
  "use cache";
  cacheTag(ETIQUETAS.catalogo);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("productos_publicos")
    .select(COLUMNAS)
    .order("categoria_orden", { ascending: true, nullsFirst: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error || !data) return [];
  return data.map(aProducto);
}

/**
 * Los destacados de la portada (doc 03 §4.2, bloque 4).
 *
 * Si el negocio todavia no marco ninguno, se muestran los primeros del catalogo
 * en vez de un hueco: una portada sin productos no comunica nada, y el
 * propietario no tiene por que saber que hay que marcar una casilla para que
 * aparezcan.
 */
export async function listarDestacados(cuantos = 8): Promise<ProductoPublico[]> {
  const productos = await listarProductos();
  const destacados = productos.filter((p) => p.destacado);
  return (destacados.length > 0 ? destacados : productos).slice(0, cuantos);
}

export async function obtenerProducto(slug: string): Promise<ProductoPublico | null> {
  const productos = await listarProductos();
  return productos.find((p) => p.slug === slug) ?? null;
}

export async function listarCategorias(): Promise<CategoriaPublica[]> {
  "use cache";
  cacheTag(ETIQUETAS.catalogo);
  cacheLife("hours");

  const supabase = crearClientePublico();
  const { data, error } = await supabase
    .from("categorias_publicas")
    .select("id, nombre, slug, descripcion, orden")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data.map((fila) => ({
    id: fila.id ?? "",
    nombre: fila.nombre ?? "",
    slug: fila.slug ?? "",
    descripcion: fila.descripcion,
  }));
}

/**
 * "S/ 0.10" o "Desde S/ 1.00".
 *
 * El precio se muestra con orgullo (ficha 5.2): hay pan a diez centimos y eso
 * es un argumento de venta, no algo que disimular con "consultar".
 */
export function formatearPrecio(soles: number): string {
  return `S/ ${soles.toFixed(2)}`;
}

export function describirPrecio(producto: ProductoPublico): string | null {
  const { precioDesde, precioHasta } = producto;
  if (precioDesde === null) return null;
  if (precioHasta === null || precioHasta === precioDesde) return formatearPrecio(precioDesde);
  return `Desde ${formatearPrecio(precioDesde)}`;
}
