import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseLocal } from "./supabase-local";
import { crearUsuario } from "./usuarios";

/** Una sesión real de la API con un usuario nuevo del rol. */
export async function sesionDeApi(rol: string): Promise<SupabaseClient> {
  const { apiUrl, anonKey } = supabaseLocal();
  const usuario = await crearUsuario(rol);
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar como ${rol}: ${error.message}`);
  return cliente;
}

/**
 * Sube el saldo de un insumo de la semilla con un conteo de la administración.
 * Se usa para que una prueba tenga stock sin depender de lo que dejó otra.
 */
export async function sumarStock(nombreInsumo: string, cantidadBase: number): Promise<void> {
  const administracion = await sesionDeApi("administrador");
  const { data: insumo, error } = await administracion
    .from("existencias_insumo")
    .select("id, cantidad_base")
    .eq("nombre", nombreInsumo)
    .single();
  if (error) throw new Error(`No se encontró ${nombreInsumo}: ${error.message}`);
  const { error: errorConteo } = await administracion.rpc("registrar_conteo", {
    p_lineas: [
      { insumo_id: insumo.id, contado: String(Number(insumo.cantidad_base) + cantidadBase) },
    ],
    p_observacion: "Stock para una prueba E2E",
  });
  if (errorConteo) throw new Error(`No se pudo sumar stock: ${errorConteo.message}`);
}
