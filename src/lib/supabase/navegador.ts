import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/tipos/database.types";

import { llavePublicaDeSupabase, urlDeSupabase } from "./entorno";

/**
 * Cliente para Componentes de Cliente (`'use client'`).
 *
 * Solo hace falta cuando hay que reaccionar a la sesion en el navegador. Las
 * lecturas y las mutaciones normales van por Server Components y Server
 * Actions, que no exponen nada al cliente.
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(urlDeSupabase(), llavePublicaDeSupabase());
}
