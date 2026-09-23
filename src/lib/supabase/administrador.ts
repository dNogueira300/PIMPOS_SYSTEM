import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/tipos/database.types";

import { urlDeSupabase } from "./entorno";

/**
 * Cliente con la `service_role`: SALTA TODA LA RLS.
 *
 * Solo existe para lo que la API de Auth no deja hacer con la sesión de una
 * persona: crear cuentas, poner su contraseña temporal, marcarlas para cambio
 * de contraseña, bloquearlas y leer su correo. Todo lo que se pueda hacer con
 * el JWT del usuario (rol, nombre, activo) se hace con `crearClienteServidor()`,
 * para que decidan la RLS y el trigger de 0029.
 *
 * Reglas para quien lo use (hoy, solo `src/lib/acciones/usuarios.ts` y las
 * páginas de `/admin/usuarios`):
 *   - siempre DESPUÉS de `exigirAcceso`, nunca antes;
 *   - antes de tocar la cuenta de otro, leer su perfil con la sesión de quien
 *     pide, para que la RLS y el rol del destino decidan si puede.
 *
 * `import "server-only"` hace fallar el build si un componente de cliente lo
 * importa, aunque sea de rebote: la llave no llega nunca a un navegador.
 * La variable NO lleva `NEXT_PUBLIC_`, así que Next tampoco la incrustaría.
 */
export function crearClienteAdministrador() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!llave) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. En local sale de `supabase status`; en Vercel, de " +
        "Supabase → Project Settings → API Keys (service_role). Nunca con NEXT_PUBLIC_.",
    );
  }
  return createClient<Database>(urlDeSupabase(), llave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
