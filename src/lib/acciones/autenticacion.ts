"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { esRol } from "@/lib/auth/roles";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esquemaIngreso } from "@/lib/validaciones/autenticacion";

export type EstadoIngreso = {
  errores?: { correo?: string[]; clave?: string[] };
  mensaje?: string;
};

/**
 * Traduce los codigos de GoTrue a algo que una persona pueda accionar (R18).
 *
 * `invalid_credentials` cubre a proposito tanto el correo inexistente como la
 * clave errada: distinguirlos permitiria averiguar que cuentas existen.
 */
function mensajeDeError(codigo: string | undefined): string {
  switch (codigo) {
    case "invalid_credentials":
      return "El correo o la contraseña no son correctos.";
    case "email_not_confirmed":
      return "Tu cuenta todavía no está confirmada. Revisa tu correo o pide ayuda al administrador.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.";
    case "user_banned":
      return "Esta cuenta está suspendida. Comunícate con el administrador.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo en un momento.";
  }
}

export async function iniciarSesion(
  _estadoPrevio: EstadoIngreso,
  datos: FormData,
): Promise<EstadoIngreso> {
  // Se valida ANTES de tocar la red: un formulario incompleto no gasta una
  // peticion ni cuenta para el limite de intentos.
  const validado = esquemaIngreso.safeParse({
    correo: datos.get("correo"),
    clave: datos.get("clave"),
  });

  if (!validado.success) {
    const { fieldErrors } = z.flattenError(validado.error);
    return { errores: { correo: fieldErrors.correo, clave: fieldErrors.clave } };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: validado.data.correo,
    password: validado.data.clave,
  });

  if (error) {
    return { mensaje: mensajeDeError(error.code) };
  }

  // Se comprueba el rol aqui mismo, con el token recien emitido. Mandar a
  // /admin y dejar que el proxy devuelva a quien no tenga permisos funciona,
  // pero encadena dos redirecciones y el navegador se queda mostrando el
  // ingreso con /admin en la barra de direcciones. Decidir el destino de una
  // vez evita ese rebote.
  const { data } = await supabase.auth.getClaims();
  if (!esRol(data?.claims?.rol)) {
    redirect("/ingresar?motivo=sin-permisos");
  }

  // A donde iba antes de que el proxy lo trajera aqui. Se exige que sea una
  // ruta interna del panel: un `volver` con URL absoluta, o que empiece por
  // `//`, seria un redirector abierto hacia cualquier sitio.
  const volver = datos.get("volver");
  const destino =
    typeof volver === "string" && volver.startsWith("/admin") && !volver.startsWith("//")
      ? volver
      : "/admin";

  redirect(destino);
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
