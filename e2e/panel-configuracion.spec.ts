import { expect, test } from "@playwright/test";

import { supabaseLocal } from "./ayudas/supabase-local";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Estas pruebas cambian la configuración real de la base local, que comparten
 * todas las pruebas del sitio. Cada una guarda el valor de antes y lo devuelve
 * en su `finally`, y el archivo corre en serie.
 */
test.describe.configure({ mode: "serial" });

async function leerAjuste(clave: string) {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const r = await fetch(
    `${apiUrl}/rest/v1/configuracion_sitio?clave=eq.${clave}&select=valor,descripcion`,
    {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  const [fila] = (await r.json()) as { valor: unknown; descripcion: string }[];
  return fila!;
}

async function restaurarAjuste(clave: string, fila: { valor: unknown; descripcion: string }) {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  await fetch(`${apiUrl}/rest/v1/configuracion_sitio?clave=eq.${clave}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fila),
  });
}

test("cambiar el WhatsApp cambia el botón de pedir del sitio sin redesplegar", async ({ page }) => {
  const antes = await leerAjuste("whatsapp");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByLabel("WhatsApp de pedidos").fill("912 345 678");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. El sitio ya muestra los datos nuevos.")).toBeVisible();

    await page.goto("/contacto");
    await expect(page.locator('a[href^="https://wa.me/51912345678"]').first()).toBeAttached();
  } finally {
    await restaurarAjuste("whatsapp", antes);
    await borrarUsuario(usuario.id);
  }
});

test("confirmar un dato provisional le quita la etiqueta y baja el aviso del inicio", async ({
  page,
}) => {
  const antes = await leerAjuste("delivery_tiempo");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin");
    const aviso = page.locator('[data-aviso="pendientes"]');
    const cuantosAntes = Number((await aviso.textContent())?.match(/\d+/)?.[0] ?? 0);

    await page.goto("/admin/configuracion");
    await page.getByRole("tab", { name: "Pedidos" }).click();
    const ajuste = page.locator('[data-ajuste="delivery_tiempo"]');
    await expect(ajuste).toHaveAttribute("data-pendiente", "true");
    await ajuste.getByLabel("Este dato ya está confirmado con el negocio").check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado.")).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: "Pedidos" }).click();
    await expect(page.locator('[data-ajuste="delivery_tiempo"]')).not.toHaveAttribute(
      "data-pendiente",
    );

    await page.goto("/admin");
    const cuantosDespues = Number(
      (
        await page
          .locator('[data-aviso="pendientes"]')
          .textContent()
          .catch(() => "0")
      )?.match(/\d+/)?.[0] ?? 0,
    );
    expect(cuantosDespues).toBe(cuantosAntes - 1);
  } finally {
    await restaurarAjuste("delivery_tiempo", antes);
    await borrarUsuario(usuario.id);
  }
});

test("un horario imposible se marca en la pestaña Horarios", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByRole("tab", { name: "Horarios" }).click();
    const lunes = page.locator('[data-dia="lunes"]');
    await lunes.getByLabel("Turno 1: abre").fill("13:00");
    await lunes.getByLabel("cierra").first().fill("04:00");
    await page.getByRole("tab", { name: "Contacto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Horarios/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(
      page.getByText("La hora de cierre tiene que ser después de la de apertura."),
    ).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no entra a configuración", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/configuracion");
    await expect(page).toHaveURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el sitio anuncia el favicon de la configuración", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /favicon/);
});
