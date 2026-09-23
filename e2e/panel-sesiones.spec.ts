import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, crearUsuario, type UsuarioDePrueba } from "./ayudas/usuarios";

/**
 * Desactivar a alguien o darle una contraseña temporal nueva le cierra la
 * sesión que tenía abierta EN EL ACTO (0030), no «en hasta una hora».
 *
 * Dos navegadores: en uno el administrador, en el otro la persona afectada con
 * su sesión abierta. Se comprueban las dos puertas: el panel (su siguiente
 * navegación acaba en el ingreso) y la base (su access token, que sigue
 * firmado y sin caducar, ya no trae rol para la RLS).
 */

async function entrarEnOtroNavegador(browser: Browser, usuario: UsuarioDePrueba): Promise<Page> {
  const { baseURL } = test.info().project.use;
  const contexto = await browser.newContext({ baseURL });
  const pagina = await contexto.newPage();
  await pagina.goto("/ingresar");
  await pagina.getByLabel("Correo").fill(usuario.correo);
  await pagina.getByLabel("Contraseña").fill(usuario.clave);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await expect(pagina).toHaveURL("/admin");
  return pagina;
}

/**
 * El access token que tiene guardado ese navegador. @supabase/ssr lo guarda en
 * la cookie `sb-…-auth-token` (partida en `.0`, `.1`… si es larga) como
 * `base64-` + JSON en base64url.
 */
async function tokenDelNavegador(contexto: BrowserContext): Promise<string> {
  const trozos = (await contexto.cookies())
    .filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => Number(a.name.split(".").at(-1)) - Number(b.name.split(".").at(-1)));
  const valor = trozos.map((c) => c.value).join("");
  expect(valor, "no hay cookie de sesión en ese navegador").toMatch(/^base64-/);
  const sesion = JSON.parse(Buffer.from(valor.slice("base64-".length), "base64url").toString());
  return (sesion as { access_token: string }).access_token;
}

/** Algo que el ingeniero ve por su ROL (no por ser él): los insumos de la semilla. */
async function insumosQueVe(token: string): Promise<unknown[]> {
  const { apiUrl, anonKey } = supabaseLocal();
  const respuesta = await fetch(`${apiUrl}/rest/v1/insumos?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  expect(respuesta.status, await respuesta.clone().text()).toBe(200);
  return (await respuesta.json()) as unknown[];
}

/** Algo que el ingeniero puede ESCRIBIR por su rol: un proveedor. */
async function crearProveedor(token: string) {
  const { apiUrl, anonKey } = supabaseLocal();
  const respuesta = await fetch(`${apiUrl}/rest/v1/proveedores`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ nombre: `Proveedor de prueba sin sesión ${Date.now()}` }),
  });
  // Con `return=minimal`, un alta que sí entra responde 201 sin cuerpo.
  const texto = await respuesta.text();
  return {
    status: respuesta.status,
    cuerpo: (texto ? JSON.parse(texto) : {}) as { code?: string },
  };
}

/** Las dos comprobaciones de «ya no entra», iguales para las dos pruebas. */
async function comprobarQueSeCerro(suya: Page, token: string) {
  // El panel: su siguiente navegación lo manda al ingreso.
  await suya.goto("/admin/contenido");
  await expect(suya).toHaveURL(/\/ingresar/);
  await expect(suya.getByRole("button", { name: "Entrar" })).toBeVisible();

  // La base: el token viejo sigue firmado, pero ya no trae rol.
  expect(await insumosQueVe(token), "con la sesión cerrada, la RLS no le enseña nada").toEqual([]);
  const escritura = await crearProveedor(token);
  expect(escritura.status).toBe(403);
  expect(escritura.cuerpo.code, "la RLS lo rechaza, no otra cosa").toBe("42501");
}

test("desactivar a alguien le cierra la sesión que tenía abierta, en el acto", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const inge = await crearUsuario("ingeniero");
  try {
    const suya = await entrarEnOtroNavegador(browser, inge);
    const token = await tokenDelNavegador(suya.context());
    expect(await insumosQueVe(token), "antes, su rol le enseña los insumos").toHaveLength(1);

    await page.goto(`/admin/usuarios/${inge.id}`);
    await page.getByRole("button", { name: "Desactivar la cuenta" }).click();
    await expect(page.getByText("Cuenta desactivada. Ya no puede entrar.")).toBeVisible();

    await comprobarQueSeCerro(suya, token);
    await suya.context().close();
  } finally {
    await borrarUsuario(inge.id);
    await borrarUsuario(admin.id);
  }
});

test("darle una contraseña temporal nueva le cierra la sesión que tenía abierta, en el acto", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const inge = await crearUsuario("ingeniero");
  try {
    const suya = await entrarEnOtroNavegador(browser, inge);
    const token = await tokenDelNavegador(suya.context());
    expect(await insumosQueVe(token), "antes, su rol le enseña los insumos").toHaveLength(1);

    await page.goto(`/admin/usuarios/${inge.id}`);
    await page.getByRole("button", { name: "Darle una contraseña temporal nueva" }).click();
    await expect(page.locator("[data-clave]")).toBeVisible();

    await comprobarQueSeCerro(suya, token);
    await suya.context().close();
  } finally {
    await borrarUsuario(inge.id);
    await borrarUsuario(admin.id);
  }
});

test("cambiar la PROPIA contraseña no cierra la sesión con la que se está entrando", async ({
  page,
}) => {
  const inge = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/cambiar-clave");
    await page.getByLabel("Contraseña nueva").fill("OtraClaveDePrueba2026");
    await page.getByLabel("Repítela").fill("OtraClaveDePrueba2026");
    await page.getByRole("button", { name: "Guardar y entrar" }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/contenido");
    await expect(page).toHaveURL("/admin/contenido");
    const token = await tokenDelNavegador(page.context());
    expect(await insumosQueVe(token)).toHaveLength(1);
  } finally {
    await borrarUsuario(inge.id);
  }
});
