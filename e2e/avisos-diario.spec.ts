import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { CRON_SECRET_DE_PRUEBA } from "./ayudas/cron";
import { supabaseLocal } from "./ayudas/supabase-local";

const RUTA = "/api/avisos/diario";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "es una ruta sin pantalla: un proyecto basta");
});

test("sin la cabecera del cron, no hace nada", async ({ request }) => {
  const respuesta = await request.get(RUTA);
  expect(respuesta.status()).toBe(401);
});

test("con un secreto equivocado, tampoco", async ({ request }) => {
  const respuesta = await request.get(RUTA, {
    headers: { Authorization: `Bearer ${CRON_SECRET_DE_PRUEBA}-no` },
  });
  expect(respuesta.status()).toBe(401);
});

test("con el correo apagado, dice por qué y deja los avisos para cuando se encienda", async ({
  request,
}) => {
  // El servidor de pruebas arranca con RESEND_API_KEY vacía (playwright.config.ts).
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const servidor = createClient(apiUrl, serviceRoleKey, { auth: { persistSession: false } });
  const clave = `e2e-avisos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { error } = await servidor.from("notificaciones").insert({
    tipo: "stock_bajo",
    titulo: "Queda poco Sal (E2E)",
    mensaje: "Quedan 2 kg de Sal.",
    clave_unica: clave,
  });
  expect(error).toBeNull();
  try {
    const respuesta = await request.get(RUTA, {
      headers: { Authorization: `Bearer ${CRON_SECRET_DE_PRUEBA}` },
    });
    expect(respuesta.status()).toBe(200);
    expect(await respuesta.json()).toEqual({ enviados: 0, motivo: "Falta RESEND_API_KEY" });

    const { data } = await servidor
      .from("notificaciones")
      .select("enviada_en")
      .eq("clave_unica", clave)
      .single();
    expect(data?.enviada_en).toBeNull();
  } finally {
    await borrarDeLaBase("notificaciones", "clave_unica", clave);
  }
});
