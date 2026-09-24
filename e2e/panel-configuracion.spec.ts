import { expect, test } from "@playwright/test";

import { supabaseLocal } from "./ayudas/supabase-local";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Estas pruebas cambian la configuración real de la base local, que comparten
 * todas las pruebas del sitio. Cada una guarda el valor de antes y lo devuelve
 * en su `finally`, y el archivo corre en serie.
 *
 * `mode: "serial"` solo ordena las pruebas DENTRO de la ejecución de un mismo
 * proyecto: `playwright.config.ts` tiene `fullyParallel: true` y corre este
 * archivo una vez por proyecto (`movil` y `escritorio`), cada una en su propio
 * worker, a la vez. Dos pruebas que tocan la MISMA fila de `configuracion_sitio`
 * —una tabla singleton, sin manera de aislar datos por prueba— se pisan: la de
 * un proyecto puede confirmar un dato PENDIENTE mientras la del otro todavía
 * está comprobando que sigue estándolo. Por eso las dos pruebas que escriben
 * (`cambiar el teléfono…`, `confirmar un dato provisional…`) se saltan fuera de
 * `movil` con `test.skip`; las demás son de solo lectura o nunca llegan a
 * escribir (la del horario imposible falla en el navegador, antes de llamar al
 * servidor), así que corren en los dos proyectos sin problema.
 *
 * Las dos que escriben usan `telefono`, no `whatsapp` ni `delivery_tiempo`:
 * `e2e/pedido.spec.ts` lee esos dos (y los otros tres ajustes PENDIENTE del
 * grupo «pedidos») con su valor de fábrica, en varios archivos que corren en
 * paralelo con este. `telefono` es el único ajuste PENDIENTE que ningún otro
 * archivo de pruebas mira, así que cambiarlo aquí no puede hacer fallar una
 * prueba de otro archivo por leerlo a medio cambiar.
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

test("cambiar el teléfono se ve en contacto sin redesplegar", async ({ page }, info) => {
  test.skip(
    info.project.name !== "movil",
    "escribe en configuracion_sitio, una fila compartida entre proyectos (ver el comentario del archivo)",
  );
  const antes = await leerAjuste("telefono");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/configuracion");
    await page.getByLabel("Teléfono fijo").fill("065 111222");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. El sitio ya muestra los datos nuevos.")).toBeVisible();

    await page.goto("/contacto");
    // El pie repite el telefono en todas las paginas (mismo dato, mismo
    // href): sin acotar a <main>, el nombre accesible sale dos veces y
    // getByRole revienta en modo estricto.
    await expect(page.getByRole("main").getByRole("link", { name: "065 111222" })).toHaveAttribute(
      "href",
      "tel:065111222",
    );
  } finally {
    await restaurarAjuste("telefono", antes);
    await borrarUsuario(usuario.id);
  }
});

test("confirmar un dato provisional le quita la etiqueta y baja el aviso del inicio", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "movil",
    "escribe en configuracion_sitio, una fila compartida entre proyectos (ver el comentario del archivo)",
  );
  const antes = await leerAjuste("telefono");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin");
    const aviso = page.locator('[data-aviso="pendientes"]');
    const cuantosAntes = Number((await aviso.textContent())?.match(/\d+/)?.[0] ?? 0);

    // Contacto es la pestaña por defecto y telefono vive ahí: no hace falta
    // cambiar de pestaña.
    await page.goto("/admin/configuracion");
    const ajuste = page.locator('[data-ajuste="telefono"]');
    await expect(ajuste).toHaveAttribute("data-pendiente", "true");
    await ajuste.getByLabel("Este dato ya está confirmado con el negocio").check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado.")).toBeVisible();

    await page.reload();
    await expect(page.locator('[data-ajuste="telefono"]')).not.toHaveAttribute("data-pendiente");

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
    await restaurarAjuste("telefono", antes);
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
