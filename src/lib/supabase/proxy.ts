import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Rol } from "@/lib/auth/roles";
import { esRol } from "@/lib/auth/roles";
import type { Database } from "@/tipos/database.types";

import { llavePublicaDeSupabase, urlDeSupabase } from "./entorno";

/**
 * Refresca la sesion y devuelve el rol del peticionario.
 *
 * Vive aparte de `src/proxy.ts` para que ese archivo se lea de un vistazo: aqui
 * esta el trasiego de cookies, alli la decision de a donde va el usuario.
 *
 * Se usa `getClaims()`, nunca `getSession()`: `getClaims()` **verifica la firma**
 * del JWT, mientras que `getSession()` se limita a leer la cookie, que el cliente
 * controla. En codigo de servidor esa diferencia es la que separa una
 * comprobacion real de una decorativa.
 */
export async function refrescarSesion(peticion: NextRequest): Promise<{
  respuesta: NextResponse;
  rol: Rol | null;
  haySesion: boolean;
}> {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient<Database>(urlDeSupabase(), llavePublicaDeSupabase(), {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(cookiesNuevas) {
        // Las cookies refrescadas tienen que ir a dos sitios: a la peticion,
        // para que los Server Components de este mismo render ya vean la sesion
        // nueva, y a la respuesta, para que el navegador las guarde.
        for (const { name, value } of cookiesNuevas) {
          peticion.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  // El claim `rol` lo inyecta app.custom_access_token() al emitir el token
  // (migracion 0003). JwtPayload lleva indice `[key: string]: any`, asi que se
  // estrecha explicitamente: un valor que no sea uno de los 4 roles es como no
  // tener ninguno.
  const rol = claims && esRol(claims.rol) ? claims.rol : null;

  return { respuesta, rol, haySesion: claims !== null };
}
