"use server";

import * as z from "zod";

import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { ejecutarAccion, type ContextoAccion, type EstadoAccion } from "@/lib/panel/accion";
import { generarClaveTemporal } from "@/lib/panel/clave-temporal";
import type { ErrorDePostgres } from "@/lib/panel/errores";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import {
  esquemaCambioClave,
  esquemaUsuario,
  leerCambioClave,
  leerUsuario,
  puedeRestablecerClave,
  rolesQuePuedeAsignar,
} from "@/lib/validaciones/usuario";

/**
 * Las cuentas del panel (F4, tarea 6).
 *
 * Reparto de trabajo entre las dos llaves:
 *   - lo que vive en `perfiles` (rol, nombre, activo, borrado) se escribe con
 *     la sesión de quien pide, para que decidan la RLS y el trigger de 0029;
 *   - lo que solo existe en Auth (crear la cuenta, su contraseña, el bloqueo)
 *     va con la service_role, SIEMPRE después de `exigirAcceso` (lo hace
 *     `ejecutarAccion`) y, cuando toca la cuenta de otro, después de leer su
 *     perfil con la sesión: la service_role no pasa por el trigger, así que la
 *     regla de «un administrador no toca a un superadmin» se repite aquí.
 *
 * La contraseña temporal no se registra en ningún sitio: viaja una vez en
 * `extra` hasta la pantalla que la enseña.
 */

const RUTA = "/admin/usuarios";
/** «Para siempre» en la API de Auth. Desbloquear es `"none"`. */
const BLOQUEO = "876000h";

const sinPermiso = (message: string) => ({ error: { code: "P0001", message } });

function deAuth(error: { code?: string; message: string }): ErrorDePostgres {
  return { code: error.code, message: error.message };
}

/**
 * Un paso con la service_role falló: el original va al registro (solo código
 * y mensaje, nunca la contraseña) y a la persona le llega una frase que dice
 * en qué quedó la cuenta y qué hacer, no la traducción genérica.
 */
function fallaAMedias(paso: string, original: { code?: string; message: string }, frase: string) {
  console.error(`[panel] ${paso}: código ${original.code ?? "?"} — ${original.message}`);
  return sinPermiso(frase);
}

/**
 * El perfil de otra persona, leído con la sesión de quien pide: si la RLS no
 * deja verlo, tampoco se toca su cuenta con la service_role.
 */
async function perfilDeOtro(
  id: string,
  { supabase, sesion }: ContextoAccion,
): Promise<{ error: ErrorDePostgres } | { error: null; rol: Rol }> {
  if (id === sesion.usuarioId) {
    return sinPermiso("Esta es tu cuenta: tu acceso lo cambia otro administrador.");
  }
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) return { error };
  return { error: null, rol: data.rol };
}

export async function crearUsuarioDelPanel(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaUsuario,
    entrada: leerUsuario(fd),
    entidad: "un usuario",
    etiquetas: [],
    mensajeOk: "Cuenta creada.",
    hacer: async (d, { supabase, sesion }) => {
      if (!rolesQuePuedeAsignar(sesion.rol).includes(d.rol)) {
        return sinPermiso("Tu rol no puede crear cuentas con ese rol.");
      }

      const clave = generarClaveTemporal();
      const admin = crearClienteAdministrador();
      const { data: alta, error: errorAlta } = await admin.auth.admin.createUser({
        email: d.correo,
        password: clave,
        email_confirm: true,
        app_metadata: { debe_cambiar_clave: true },
        user_metadata: { nombre_completo: d.nombre_completo },
      });
      if (errorAlta || !alta.user) {
        return errorAlta?.code === "email_exists"
          ? sinPermiso("Ya hay una cuenta con ese correo.")
          : { error: errorAlta ? deAuth(errorAlta) : { message: "Auth no devolvió la cuenta." } };
      }

      // El rol lo pone la sesión de quien crea, no la service_role: así deciden
      // la RLS y el trigger de 0029 (un administrador no crea superadmins).
      const { error } = await supabase
        .from("perfiles")
        .update({
          rol: d.rol,
          nombre_completo: d.nombre_completo,
          celular: d.celular,
          activo: true,
        })
        .eq("id", alta.user.id)
        .select("id")
        .single();
      if (error) {
        // Sin perfil activo la cuenta no serviría: se deshace el alta entera.
        await admin.auth.admin.deleteUser(alta.user.id);
        return { error };
      }

      return { error: null, id: alta.user.id, extra: { clave, correo: d.correo } };
    },
  });
}

export async function guardarUsuario(fd: FormData): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: esquemaUsuario.extend({ id: z.uuid() }),
    entrada: leerUsuario(fd),
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk:
      "Cambios guardados. El rol nuevo vale desde su próximo ingreso o en menos de una hora.",
    // El correo llega (el esquema es uno) pero no se escribe: cambiarlo exige
    // confirmarlo por correo, y sin SMTP propio no llega.
    hacer: async (d, { supabase }) => {
      const { error } = await supabase
        .from("perfiles")
        .update({ nombre_completo: d.nombre_completo, celular: d.celular, rol: d.rol })
        .eq("id", d.id)
        .is("deleted_at", null)
        .select("id")
        .single();
      return { error, id: d.id };
    },
  });
}

export async function cambiarActivo(id: string, activo: boolean): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid(), activo: z.boolean() }),
    entrada: { id, activo },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: activo ? "Cuenta reactivada." : "Cuenta desactivada. Ya no puede entrar.",
    hacer: async (d, contexto) => {
      const destino = await perfilDeOtro(d.id, contexto);
      if (destino.error) return { error: destino.error };

      // Primero el perfil, con la sesión: si el trigger lo niega (un
      // administrador desactivando a un superadmin), no se llega a bloquear.
      const { error } = await contexto.supabase
        .from("perfiles")
        .update({ activo: d.activo })
        .eq("id", d.id)
        .select("id")
        .single();
      if (error) return { error };

      // Bloquear impide volver a entrar. Lo que ya tenía abierto lo cierra el
      // trigger de 0030 al pasar `activo` a false, en el acto.
      const { error: errorBloqueo } = await crearClienteAdministrador().auth.admin.updateUserById(
        d.id,
        { ban_duration: d.activo ? "none" : BLOQUEO },
      );
      return { error: errorBloqueo ? deAuth(errorBloqueo) : null, id: d.id };
    },
  });
}

export async function restablecerClave(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: "Contraseña temporal nueva creada.",
    hacer: async (d, contexto) => {
      const destino = await perfilDeOtro(d.id, contexto);
      if (destino.error) return { error: destino.error };
      // La service_role no pasa por el trigger de 0029: sin esta línea, un
      // administrador podría quedarse con la contraseña de un superadmin (o de
      // otro administrador) y entrar como él.
      if (!puedeRestablecerClave(contexto.sesion.rol, destino.rol)) {
        return sinPermiso(
          `Solo el super administrador puede darle una contraseña nueva a un ${NOMBRE_DEL_ROL[destino.rol].toLowerCase()}.`,
        );
      }

      // Primero se cierran sus sesiones (0030) y DESPUÉS se cambia la
      // contraseña. Al revés, si lo segundo fallara, la contraseña nueva ya
      // valdría sin que nadie la hubiera visto y la sesión vieja seguiría
      // abierta. Así, lo peor que deja un fallo a medias es a esa persona
      // fuera, con su contraseña de siempre.
      const admin = crearClienteAdministrador();
      const { error: errorSesiones } = await admin.rpc("cerrar_sesiones", { usuario: d.id });
      if (errorSesiones) {
        return fallaAMedias(
          "restablecer (cerrar sesiones)",
          errorSesiones,
          "No se pudo darle una contraseña nueva: no cambió nada. Inténtalo otra vez en un momento.",
        );
      }

      const clave = generarClaveTemporal();
      const { data, error } = await admin.auth.admin.updateUserById(d.id, {
        password: clave,
        app_metadata: { debe_cambiar_clave: true },
      });
      if (error) {
        return fallaAMedias(
          "restablecer (contraseña)",
          error,
          "Se cerró su sesión, pero la contraseña no se cambió: sigue siendo la de antes. Pulsa otra vez «Darle una contraseña temporal nueva».",
        );
      }
      return { error: null, id: d.id, extra: { clave, correo: data.user.email ?? "" } };
    },
  });
}

export async function eliminarUsuario(id: string): Promise<EstadoAccion> {
  return ejecutarAccion({
    ruta: RUTA,
    esquema: z.object({ id: z.uuid() }),
    entrada: { id },
    entidad: "el usuario",
    etiquetas: [],
    mensajeOk: "Cuenta eliminada. Su historial de cambios se conserva.",
    hacer: async (d, contexto) => {
      if (contexto.sesion.rol !== "superadmin") {
        return sinPermiso("Solo el super administrador puede eliminar usuarios.");
      }
      const destino = await perfilDeOtro(d.id, contexto);
      if (destino.error) return { error: destino.error };

      // Borrado lógico del perfil + bloqueo. No se borra de auth.users: la
      // auditoría tiene que seguir sabiendo quién hizo cada cambio.
      const { error } = await contexto.supabase
        .from("perfiles")
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq("id", d.id)
        .select("id")
        .single();
      if (error) return { error };
      const { error: errorBloqueo } = await crearClienteAdministrador().auth.admin.updateUserById(
        d.id,
        { ban_duration: BLOQUEO },
      );
      return { error: errorBloqueo ? deAuth(errorBloqueo) : null };
    },
  });
}

/** Primer ingreso (o cuando alguien quiera cambiarla). Cualquier rol activo. */
export async function cambiarMiClave(fd: FormData): Promise<EstadoAccion> {
  // Cualquier rol entra a /admin; sin rol activo (cuenta desactivada) no hay
  // contraseña que cambiar desde aquí.
  const sesion = await exigirAcceso("/admin");

  const validado = esquemaCambioClave.safeParse(leerCambioClave(fd));
  if (!validado.success) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados en rojo.",
      errores: z.flattenError(validado.error).fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: validado.data.clave });
  if (error) {
    // Solo el código: el mensaje de Auth podría citar lo que se escribió.
    console.error(`[panel] cambiar mi contraseña: código ${error.code ?? "?"}`);
    return {
      estado: "error",
      mensaje:
        error.code === "same_password"
          ? "Esa es la contraseña que ya tienes. Elige otra."
          : error.code === "weak_password"
            ? "Esa contraseña es muy fácil de adivinar. Elige otra más larga."
            : "No se pudo cambiar la contraseña. Inténtalo otra vez.",
    };
  }

  // Se quita la marca por la cuenta de la sesión verificada, nunca por un id
  // que llegue del formulario.
  const { error: errorMarca } = await crearClienteAdministrador().auth.admin.updateUserById(
    sesion.usuarioId,
    { app_metadata: { debe_cambiar_clave: false } },
  );
  if (errorMarca) {
    console.error(
      `[panel] quitar la marca de contraseña temporal: código ${errorMarca.code ?? "?"}`,
    );
    return {
      estado: "error",
      mensaje:
        "Tu contraseña nueva ya vale, pero no se pudo terminar. Sal y vuelve a entrar con ella.",
    };
  }
  // El JWT todavía lleva la marca: se pide uno nuevo para que el proxy deje pasar.
  await supabase.auth.refreshSession();

  return { estado: "ok", mensaje: "Contraseña cambiada. Bienvenido al panel." };
}
