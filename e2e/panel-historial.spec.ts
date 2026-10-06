import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, type UsuarioDePrueba } from "./ayudas/usuarios";

// Todas cambian el precio de la misma presentación de la semilla: de una en una.
test.describe.configure({ mode: "serial" });

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "cambia un precio compartido; un proyecto basta");
});

/** La misma persona que entró al panel, por la API: sus cambios quedan a su nombre. */
async function apiDe(usuario: UsuarioDePrueba) {
  const { apiUrl, anonKey } = supabaseLocal();
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar por la API: ${error.message}`);
  return cliente;
}

/** Cambia el precio de una presentación y devuelve cómo dejarla como estaba. */
async function cambiarUnPrecio(usuario: UsuarioDePrueba) {
  const api = await apiDe(usuario);
  const { data: v } = await api
    .from("producto_variantes")
    .select("id, nombre, precio, producto_id, productos(nombre)")
    .is("deleted_at", null)
    .order("id")
    .limit(1)
    .single();
  if (!v) throw new Error("No hay presentaciones en la semilla");
  const antes = Number(v.precio);
  const despues = Number((antes + 0.05).toFixed(2));
  await api.from("producto_variantes").update({ precio: despues }).eq("id", v.id);
  return {
    productoId: v.producto_id as string,
    antes,
    despues,
    restaurar: async () => {
      await api.from("producto_variantes").update({ precio: antes }).eq("id", v.id);
    },
  };
}

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

async function abrirHistorial(page: Page, consulta = "") {
  await page.goto(`/admin/auditoria${consulta}`);
  await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();
}

test("la administración encuentra un cambio de precio, lo abre y ve el antes y el después", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    // Varias pruebas a la vez crean un «Prueba administrador»: se filtra por
    // esta persona, y de paso se prueba que el filtro de la dirección funciona.
    await abrirHistorial(page, `?seccion=productos&cuando=hoy&persona=${usuario.id}`);
    const fila = page.getByRole("link", {
      name: `Prueba administrador cambió la presentación`,
    });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText(`Precio ${soles(precio.antes)} → ${soles(precio.despues)}`);
    await fila.click();
    await page.waitForURL(/\/admin\/auditoria\/\d+$/);

    await expect(page.locator("[data-frase]")).toContainText("cambió la presentación");
    const diferencias = page.locator("[data-diferencias]");
    await expect(diferencias).toContainText("Precio");
    await expect(diferencias).toContainText(soles(precio.antes));
    await expect(diferencias).toContainText(soles(precio.despues));

    const tecnico = page.locator("[data-detalle-tecnico]");
    await expect(tecnico.getByText("public.producto_variantes")).toBeHidden();
    await tecnico.getByText("Detalle técnico").click();
    await expect(tecnico.getByText("public.producto_variantes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a donde se hizo" })).toHaveAttribute(
      "href",
      `/admin/contenido/productos/${precio.productoId}`,
    );
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("los filtros se aplican al elegir, sin recargar la página", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await abrirHistorial(page);
    await page.evaluate(() => {
      (window as unknown as { sinRecargar: boolean }).sinRecargar = true;
    });
    await page.getByLabel("Persona").selectOption(usuario.id);
    await expect(page).toHaveURL(new RegExp(`persona=${usuario.id}`));
    await page.getByLabel("Qué hizo").selectOption("cambio");
    await expect(page).toHaveURL(/hizo=cambio/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ }).first()).toBeVisible();
    // Con «Creó» ese cambio ya no está.
    await page.getByLabel("Qué hizo").selectOption("creo");
    await expect(page).toHaveURL(/hizo=creo/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ })).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar),
    ).toBe(true);
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("una dirección con filtros inventados no rompe la página (Review Focus)", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await abrirHistorial(
      page,
      "?persona=abc&seccion=otra&hizo=rompio&cuando=siempre&desde=ayer&ver=999999",
    );
    await expect(page.getByLabel("Cuándo")).toHaveValue("7");
    // No por `role="alert"`: Next deja siempre uno vacío, su anunciador de rutas.
    await expect(page.getByText("No se pudo cargar el historial")).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Cambios en el panel" })
        .or(page.getByText("No hay cambios con esos filtros")),
    ).toBeVisible();
    await page.goto("/admin/auditoria/no-es-un-numero");
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve «Historial» ni llega escribiendo la dirección", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await expect(page.locator('[data-seccion="Historial"]')).toHaveCount(0);
    for (const ruta of ["/admin/auditoria", "/admin/auditoria/1"]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});
