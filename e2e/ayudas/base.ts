import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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

/**
 * SQL como `postgres` en la base local, para lo que PostgREST no deja (apagar un trigger). Solo pruebas.
 * El SQL entra por la entrada estándar y no como argumento: así MSYS no
 * convierte nada en Git Bash.
 */
export function sqlLocal(sql: string): string {
  const proyecto = /^project_id\s*=\s*"([^"]+)"/m.exec(
    readFileSync("supabase/config.toml", "utf8"),
  )?.[1];
  if (!proyecto) throw new Error("No se encontró project_id en supabase/config.toml");
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${proyecto}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-tA",
    ],
    {
      input: sql,
      encoding: "utf8",
    },
  );
}
