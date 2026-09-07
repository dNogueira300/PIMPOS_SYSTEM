import { supabaseLocal } from "./supabase-local";

/**
 * Alta y baja de usuarios de prueba contra el Supabase LOCAL, por la Admin API.
 *
 * Este modulo solo lo usan las pruebas E2E; nunca entra en el bundle de la
 * aplicacion, que es la unica razon por la que puede tocar la `service_role`.
 */
function cabeceras(): Record<string, string> {
  const { serviceRoleKey } = supabaseLocal();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

export const CLAVE_DE_PRUEBA = "ClaveDePruebaPimpos2026";

export type UsuarioDePrueba = { id: string; correo: string; clave: string };

/**
 * Crea un usuario confirmado y le asigna el rol.
 *
 * Reproduce el flujo real de dos pasos (ver README): el alta crea la cuenta y
 * el trigger su perfil INACTIVO; despues un administrador asigna el rol de
 * forma explicita. Ningun metadato concede permisos, asi que este segundo paso
 * es obligatorio -- tambien en las pruebas.
 *
 * `rol: null` simula justamente el descuido de saltarse ese segundo paso.
 */
export async function crearUsuario(rol: string | null): Promise<UsuarioDePrueba> {
  const { apiUrl } = supabaseLocal();
  const correo = `e2e-${rol ?? "sin-rol"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@pimpos.test`;

  const alta = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: cabeceras(),
    body: JSON.stringify({ email: correo, password: CLAVE_DE_PRUEBA, email_confirm: true }),
  });

  if (!alta.ok) {
    throw new Error(`No se pudo crear el usuario de prueba: ${await alta.text()}`);
  }

  const { id } = (await alta.json()) as { id: string };

  if (rol !== null) {
    const activacion = await fetch(`${apiUrl}/rest/v1/perfiles?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...cabeceras(), Prefer: "return=minimal" },
      body: JSON.stringify({ rol, nombre_completo: `Prueba ${rol}`, activo: true }),
    });

    if (!activacion.ok) {
      throw new Error(`No se pudo asignar el rol ${rol}: ${await activacion.text()}`);
    }
  }

  return { id, correo, clave: CLAVE_DE_PRUEBA };
}

export async function borrarUsuario(id: string): Promise<void> {
  const { apiUrl } = supabaseLocal();
  await fetch(`${apiUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: cabeceras(),
  });
}
