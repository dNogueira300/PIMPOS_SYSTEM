import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/tipos/database.types";

import { llavePublicaDeSupabase, urlDeSupabase } from "./entorno";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 *
 * Es `async` porque en Next.js 16 `cookies()` devuelve una promesa: el acceso
 * sincrono de la etapa de compatibilidad de la 15 se elimino.
 *
 * Usa la llave publica, no la `service_role`: cada consulta viaja con el JWT
 * del usuario y la RLS decide que ve. Ese es el punto de todo el diseno.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient<Database>(urlDeSupabase(), llavePublicaDeSupabase(), {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Escribir cookies desde un Server Component lanza: HTTP no permite
          // mandar Set-Cookie una vez empezado el streaming. Se ignora sin
          // riesgo porque el proxy ya refresco la sesion antes de renderizar.
          // Desde una Server Action o un Route Handler si escribe, que es
          // donde de verdad hace falta.
        }
      },
    },
  });
}
