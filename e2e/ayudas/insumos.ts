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
 * Sube el saldo de un insumo de la semilla con un ingreso (ajuste) de la
 * administración. Se usa para que una prueba tenga stock sin depender de lo
 * que dejó otra.
 *
 * Es una suma RELATIVA y atómica: inserta un movimiento directo
 * (`tipo: "ajuste", sentido: 1`) en vez de leer el saldo y mandar un
 * `registrar_conteo` con el total absoluto. Con `fullyParallel: true` y varias
 * pruebas usando esta ayuda a la vez sobre el mismo insumo, un
 * lectura-modificación-escritura así pierde en silencio lo que sumó la otra
 * carrera; un `insert` que solo dice "+N" no puede perder nada porque no lee
 * nada.
 *
 * Solo admite insumos NO perecibles: una entrada de uno perecible exige un
 * lote con fecha de vencimiento (trigger de 0034), y esta ayuda no la inventa
 * porque ninguna prueba de la suite lo necesita todavía. Si hiciera falta,
 * hay que crear el lote a mano (`lotes_insumo`) y pasar su `lote_id`.
 */
export async function sumarStock(nombreInsumo: string, cantidadBase: number): Promise<void> {
  const administracion = await sesionDeApi("administrador");
  const { data: insumo, error } = await administracion
    .from("insumos")
    .select("id, unidad_base_id, es_perecible")
    .eq("nombre", nombreInsumo)
    .single();
  if (error) throw new Error(`No se encontró ${nombreInsumo}: ${error.message}`);
  if (insumo.es_perecible) {
    throw new Error(
      `sumarStock no admite insumos perecibles (${nombreInsumo} lo es): un ingreso necesita un lote con fecha de vencimiento. Usa un insumo no perecible, o crea el lote a mano si hace falta.`,
    );
  }
  const { error: errorAjuste } = await administracion.from("movimientos_insumo").insert({
    tipo: "ajuste",
    sentido: 1,
    insumo_id: insumo.id,
    cantidad: cantidadBase,
    unidad_id: insumo.unidad_base_id,
    observacion: "Stock para una prueba E2E",
  });
  if (errorAjuste) throw new Error(`No se pudo sumar stock: ${errorAjuste.message}`);
}
