import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/servidor";

import { esRol, puedeAcceder, type Rol } from "./roles";

export type Sesion = {
  usuarioId: string;
  correo: string | null;
  rol: Rol | null;
};

/**
 * Sesion del peticionario, o null si no hay ninguna. Para Server Components,
 * Server Actions y Route Handlers.
 *
 * `getClaims()` verifica la firma del JWT; `getSession()` solo lee la cookie,
 * que el cliente controla. En servidor se usa siempre la primera.
 */
export async function obtenerSesion(): Promise<Sesion | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return null;

  const { claims } = data;
  return {
    usuarioId: String(claims.sub),
    correo: typeof claims.email === "string" ? claims.email : null,
    rol: esRol(claims.rol) ? claims.rol : null,
  };
}

/**
 * Exige sesion con permiso sobre `ruta`, o redirige.
 *
 * Se llama al principio de cada pagina del panel y de cada Server Action que
 * mute datos. Repetir aqui lo que ya hace el proxy es deliberado: las Server
 * Functions se resuelven como POST a la ruta donde viven, y un cambio de
 * `matcher` puede sacarlas de la guardia del proxy sin avisar.
 *
 * Aun asi, esto tampoco es la ultima palabra: la RLS de Postgres es la que de
 * verdad decide, y seguiria negando aunque estas dos capas fallaran.
 */
export async function exigirAcceso(ruta: string): Promise<Sesion & { rol: Rol }> {
  const sesion = await obtenerSesion();

  if (sesion === null) {
    redirect(`/ingresar?volver=${encodeURIComponent(ruta)}`);
  }
  if (sesion.rol === null) {
    redirect("/ingresar?motivo=sin-permisos");
  }
  if (!puedeAcceder(sesion.rol, ruta)) {
    redirect("/admin?motivo=sin-acceso");
  }

  return { ...sesion, rol: sesion.rol };
}
