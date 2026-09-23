import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/tipos/database.types";

/**
 * ¿Sigue abierta en el servidor la sesión del token que trae este cliente?
 *
 * `getClaims()` solo verifica la firma, en local; desactivar a alguien o
 * restablecer su contraseña borra su sesión de auth.sessions (0030) y el token
 * sigue firmado. Esto se lo pregunta a la base.
 *
 * Por qué a la base y no a Auth con `getUser()`, que también lo sabe: por
 * coste, medido en local. PostgREST contesta en ~20 ms; `/auth/v1/user`, en
 * ~200-350 ms en reposo y en más de un segundo con la suite E2E en marcha. Con
 * `getUser()` en cada navegación del panel, la suite pasó de 4 a 7 minutos.
 *
 * `true` abierta, `false` cerrada, `null` si no se pudo saber (red, base
 * caída): quien llama falla cerrado con los dos últimos.
 */
export async function sesionAbierta(supabase: SupabaseClient<Database>): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("sesion_abierta");
  if (error || typeof data !== "boolean") return null;
  return data;
}
