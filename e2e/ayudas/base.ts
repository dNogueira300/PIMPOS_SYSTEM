import { supabaseLocal } from "./supabase-local";

/** Borrado físico de lo que creó una prueba, con la service_role local. */
export async function borrarDeLaBase(tabla: string, columna: string, valor: string): Promise<void> {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const respuesta = await fetch(
    `${apiUrl}/rest/v1/${tabla}?${columna}=eq.${encodeURIComponent(valor)}`,
    {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  if (!respuesta.ok) {
    throw new Error(`No se pudo limpiar ${tabla}: ${respuesta.status} ${await respuesta.text()}`);
  }
}
