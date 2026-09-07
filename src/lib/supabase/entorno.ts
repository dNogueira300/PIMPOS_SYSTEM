/**
 * Lectura de las variables de Supabase, en un solo sitio.
 *
 * Ambas llevan `NEXT_PUBLIC_` a proposito: son las que el navegador necesita y
 * son publicas por diseno. La `service_role` NO se lee aqui ni en ningun modulo
 * que pueda acabar en un bundle de cliente -- esa llave salta toda la RLS.
 *
 * Se leen con `process.env.NOMBRE_LITERAL` porque Next sustituye estas
 * expresiones en tiempo de compilacion; un acceso dinamico (`process.env[x]`)
 * no se sustituye y llegaria vacio al navegador.
 */
function exigir(valor: string | undefined, nombre: string): string {
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y ` +
        `completala con los valores de \`supabase status\` (local) o del panel (produccion).`,
    );
  }
  return valor;
}

export function urlDeSupabase(): string {
  return exigir(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}

export function llavePublicaDeSupabase(): string {
  return exigir(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
