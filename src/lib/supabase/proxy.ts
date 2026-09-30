import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_ACTIVIDAD, DURACION_MARCA_S, sesionInactiva } from "@/lib/auth/inactividad";
import type { Rol } from "@/lib/auth/roles";
import { esRol } from "@/lib/auth/roles";
import type { Database } from "@/tipos/database.types";

import { llavePublicaDeSupabase, urlDeSupabase } from "./entorno";
import { sesionAbierta } from "./sesion-abierta";

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
export async function refrescarSesion(
  peticion: NextRequest,
  /**
   * Preguntarle además a Auth si la sesión sigue abierta (ver abajo). Solo en
   * el ingreso y el cambio de contraseña: en el panel lo pregunta
   * `exigirAcceso`, y en el sitio público sería una llamada de red para nada.
   */
  {
    comprobarEnServidor,
    vigilarInactividad,
  }: {
    comprobarEnServidor: boolean;
    /**
     * Cerrar la sesión tras dos horas sin actividad y renovar la marca
     * (`src/lib/auth/inactividad.ts`). Solo en el panel y en el ingreso: en el
     * sitio público una cookie nueva en cada respuesta estorbaría a la caché, y
     * leer una página pública no es usar el panel.
     */
    vigilarInactividad: boolean;
  },
): Promise<{
  respuesta: NextResponse;
  rol: Rol | null;
  haySesion: boolean;
  debeCambiarClave: boolean;
  /** Se acaba de cerrar por inactividad: el proxy lo dice en el ingreso. */
  inactiva: boolean;
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
  let claims = data?.claims ?? null;

  // `getClaims()` verifica la firma en local (clave asimétrica): no se entera
  // de que la sesión se cerró en el servidor al desactivar a alguien o
  // restablecer su contraseña (0030). Se le pregunta a la base con
  // `sesion_abierta()` (ver `sesionAbierta()`). Cualquier fallo cuenta como
  // sin sesión (falla cerrado); solo un «no» de la base borra además las
  // cookies, para que un corte de red no cierre la sesión a nadie.
  if (claims && comprobarEnServidor) {
    const abierta = await sesionAbierta(supabase);
    if (abierta === false) await supabase.auth.signOut({ scope: "local" });
    if (abierta !== true) claims = null;
  }

  // Dos horas sin actividad (pedido de Dan, 29/09/2026). Se cierra como una
  // sesión cerrada en el servidor: se revoca y se borran sus cookies.
  let inactiva = false;
  const marca = peticion.cookies.get(COOKIE_ACTIVIDAD)?.value;
  if (claims && vigilarInactividad) {
    inactiva = sesionInactiva(marca, Date.now());
    if (inactiva) {
      await supabase.auth.signOut({ scope: "local" });
      claims = null;
    }
  } else if (vigilarInactividad && marca !== undefined) {
    // Ya sin sesión, pero con la marca vencida: la cerró la inactividad en
    // una petición anterior (una precarga, otra pestaña). Salir la borra, así
    // que quien cerró sesión a propósito no ve este motivo.
    inactiva = sesionInactiva(marca, Date.now());
  }

  // Al final, después de cualquier `setAll`, que vuelve a crear la respuesta.
  //
  // Solo con sesión, y solo al cargar una página entera (`sec-fetch-dest:
  // document`, lo pone el navegador). Las peticiones del router —precargas de
  // `<Link>`, navegaciones del panel, Server Actions— no la renuevan: Next le
  // quita al proxy las cabeceras que dirían cuál es una precarga, y una
  // precarga sale sin que nadie toque nada, así que contaría como actividad de
  // una pestaña quieta. Las demás nacen de un toque o de una tecla, y esas ya
  // las renueva el navegador (`VigiaInactividad`). Sin la cabecera (navegador
  // muy viejo, curl) cuenta como página entera.
  //
  // Sin sesión no se borra: una marca vencida que se queda hace que un cierre
  // que falló (sin red) se vuelva a intentar en la petición siguiente, y
  // entrar la reescribe (`iniciarSesion`).
  const esPaginaEntera = (peticion.headers.get("sec-fetch-dest") ?? "document") === "document";
  if (vigilarInactividad && claims && esPaginaEntera) {
    respuesta.cookies.set(COOKIE_ACTIVIDAD, String(Date.now()), {
      path: "/",
      sameSite: "lax",
      secure: peticion.nextUrl.protocol === "https:",
      // La lee y la renueva también el navegador (`VigiaInactividad`).
      httpOnly: false,
      maxAge: DURACION_MARCA_S,
    });
  }

  // El claim `rol` lo inyecta app.custom_access_token() al emitir el token
  // (migracion 0003). JwtPayload lleva indice `[key: string]: any`, asi que se
  // estrecha explicitamente: un valor que no sea uno de los 4 roles es como no
  // tener ninguno.
  const rol = claims && esRol(claims.rol) ? claims.rol : null;

  // Lo ponen el alta y el «restablecer» del panel de usuarios (T6) en
  // `app_metadata`, que solo escribe la service_role: el usuario no se lo puede
  // quitar editando su propio perfil ni con `auth.updateUser`.
  const metadatos = claims?.app_metadata as Record<string, unknown> | undefined;
  const debeCambiarClave = metadatos?.debe_cambiar_clave === true;

  return { respuesta, rol, haySesion: claims !== null, debeCambiarClave, inactiva };
}
