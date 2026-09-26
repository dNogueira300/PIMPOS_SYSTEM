import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { supabaseLocal } from "./ayudas/supabase-local";
import { crearUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "no depende del tamaño de pantalla");
});

async function sesion(rol: string) {
  const { apiUrl, anonKey } = supabaseLocal();
  const usuario = await crearUsuario(rol);
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar: ${error.message}`);
  return cliente;
}

test("dos consumos a la vez del mismo insumo: uno entra, el otro dice cuánto queda", async () => {
  const administracion = await sesion("administrador");
  const [uno, otro] = await Promise.all([sesion("ingeniero"), sesion("ingeniero")]);

  const { data: kg } = await administracion
    .from("unidades_medida")
    .select("id")
    .eq("codigo", "kg")
    .single();
  const { data: insumoId, error: errorInsumo } = await administracion.rpc("guardar_insumo", {
    p_insumo: {
      nombre: `Concurrencia ${Date.now()}`,
      unidad_base_id: kg!.id,
      stock_minimo: "0",
      es_perecible: false,
    },
    p_equivalencias: [],
  });
  expect(errorInsumo).toBeNull();

  const { error: errorAjuste } = await administracion.from("movimientos_insumo").insert({
    tipo: "ajuste",
    sentido: 1,
    insumo_id: insumoId!,
    cantidad: 10,
    unidad_id: kg!.id,
    observacion: "Prueba de concurrencia",
  });
  expect(errorAjuste).toBeNull();

  const consumir = (cliente: typeof uno) =>
    cliente.rpc("registrar_consumo", {
      p_cabecera: {
        origen_consumo: "produccion",
        destino_lote: "Prueba",
        area_turno: "Mañana",
        observacion: "Carrera",
      },
      p_lineas: [{ insumo_id: insumoId, cantidad: "7", unidad_id: kg!.id }],
    });

  try {
    const [a, b] = await Promise.all([consumir(uno), consumir(otro)]);
    const errores = [a.error, b.error].filter((e) => e !== null);

    expect(errores, "exactamente uno de los dos tiene que fallar").toHaveLength(1);
    expect(errores[0]!.message).toMatch(/^Solo hay 3 kg de Concurrencia/);

    const { data: saldo } = await administracion
      .from("saldos_insumo")
      .select("cantidad_base")
      .eq("insumo_id", insumoId!)
      .single();
    expect(Number(saldo!.cantidad_base)).toBe(3);
  } finally {
    // Limpieza parcial, a propósito incompleta: el insumo ya tiene movimientos
    // (el ajuste y el consumo que entró), y `movimientos_insumo.insumo_id` es
    // `on delete restrict` — el kárdex nunca se borra (CLAUDE.md, decisión 2 del
    // plan 05). Lo único que se puede hacer es retirarlo, igual que
    // `retirarInsumo`, para que no quede visible en Existencias. La fila sigue
    // contando en un `count(*) from insumos` sin filtrar: por eso el cierre de
    // esta tarea corre `supabase db reset` antes del último `supabase test db`.
    await administracion
      .from("insumos")
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq("id", insumoId!);
  }
});
