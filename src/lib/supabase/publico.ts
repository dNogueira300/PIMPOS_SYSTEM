import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/tipos/database.types";

import { llavePublicaDeSupabase, urlDeSupabase } from "./entorno";

/**
 * Cliente para el sitio publico. **No lee cookies.**
 *
 * Esa es toda la diferencia con `crearClienteServidor()`, y es la que importa
 * por dos motivos:
 *
 * 1. Leer una cookie ata el renderizado a la peticion. Con Cache Components,
 *    una funcion marcada `use cache` que tocara `cookies()` dejaria de poder
 *    cachearse y el sitio publico perderia el prerenderizado entero.
 *
 * 2. Sin sesion, PostgREST atiende como `anon`, y la RLS le muestra
 *    exactamente lo que ve un visitante: nada de borradores, nada de
 *    promociones sin aprobar, nada de clientes. La pagina publica no puede
 *    filtrar de mas ni de menos porque no es ella quien filtra.
 *
 * `persistSession: false` porque en el servidor no hay a donde persistir y
 * cada renderizado es independiente.
 */
export function crearClientePublico() {
  return createClient<Database>(urlDeSupabase(), llavePublicaDeSupabase(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * URL publica de un archivo de Storage.
 *
 * Las filas guardan la ruta dentro de su bucket, nunca la URL entera: guardar
 * la URL ataria cada fila al dominio del proyecto, y bastaria cambiar de
 * proyecto para romper todas las imagenes a la vez.
 */
export function urlDeImagen(bucket: string, ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  // Ya viene absoluta: alguien pego una URL externa en el panel. Se respeta.
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) return ruta;

  // Empieza por barra: es un archivo de `public/`, no del bucket. Es el caso
  // del logo y el favicon antes de que el negocio suba los suyos (R21): asi el
  // sitio tiene marca desde el primer despliegue, sin depender de Storage.
  if (ruta.startsWith("/")) return ruta;

  return `${urlDeSupabase()}/storage/v1/object/public/${bucket}/${ruta}`;
}
