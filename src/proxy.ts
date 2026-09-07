import { NextResponse, type NextRequest } from "next/server";

import { esRutaDelPanel, puedeAcceder } from "@/lib/auth/roles";
import { refrescarSesion } from "@/lib/supabase/proxy";

/**
 * Se llamaba `middleware.ts` hasta Next.js 15. En la 16 el nombre es `proxy` y
 * el runtime es Node, sin opcion de edge.
 *
 * Hace dos cosas:
 *   1. Refrescar la sesion en cada peticion, para que no caduque sola.
 *   2. Mandar al ingreso a quien no deba estar donde esta.
 *
 * El punto 2 es una comodidad de navegacion, NO el control de acceso. La propia
 * documentacion de Next avisa de que las Server Functions se resuelven como POST
 * a la ruta donde se usan, asi que un cambio de `matcher` puede dejarlas fuera
 * de esta guardia sin que nadie lo note. La autorizacion de verdad esta en las
 * politicas RLS de Postgres, que se aplican vaya la peticion por donde vaya.
 */
export async function proxy(peticion: NextRequest) {
  const { respuesta, rol, haySesion } = await refrescarSesion(peticion);
  const ruta = peticion.nextUrl.pathname;

  // Quien ya tiene sesion util no necesita ver el formulario de ingreso.
  if (ruta === "/ingresar" && rol !== null) {
    return NextResponse.redirect(new URL("/admin", peticion.url));
  }

  if (!esRutaDelPanel(ruta)) {
    return respuesta;
  }

  if (!haySesion) {
    const destino = new URL("/ingresar", peticion.url);
    // Se recuerda a donde iba para devolverlo alli despues de entrar.
    destino.searchParams.set("volver", ruta);
    return NextResponse.redirect(destino);
  }

  // Con sesion pero sin rol: cuenta creada y todavia sin activar, o dada de
  // baja. El hook le emite `rol: null` y la base le niega todo, asi que en vez
  // de un panel vacio y confuso se le explica que pasa.
  if (rol === null) {
    return NextResponse.redirect(new URL("/ingresar?motivo=sin-permisos", peticion.url));
  }

  if (!puedeAcceder(rol, ruta)) {
    return NextResponse.redirect(new URL("/admin?motivo=sin-acceso", peticion.url));
  }

  return respuesta;
}

export const config = {
  // Sin matcher, el proxy correria tambien sobre CSS, JS e imagenes, y una
  // redireccion de auth dejaria la pagina sin estilos.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
