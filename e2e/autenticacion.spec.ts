import { expect, test } from "@playwright/test";

import { borrarUsuario, crearUsuario } from "./ayudas/usuarios";

// Flujos de ingreso por rol (doc 03 §6). Cada prueba crea su propio usuario
// contra el Supabase local y lo borra al terminar, para no depender del orden
// ni dejar residuos.

test("el panel redirige al ingreso a quien no tiene sesion", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/ingresar\?volver=%2Fadmin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pimpo's");
});

test("un formulario vacio se rechaza sin llamar al servidor de auth", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Escribe tu correo.")).toBeVisible();
  await expect(page.getByText("Escribe tu contrasena.")).toBeVisible();
});

test("unas credenciales incorrectas no revelan si la cuenta existe", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill("nadie@pimpos.test");
  await page.getByLabel("Contraseña").fill("claveequivocada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByTestId("error-ingreso")).toContainText(
    "El correo o la contraseña no son correctos",
  );
  await expect(page).toHaveURL(/\/ingresar/);
});

test("un superadmin entra y ve todas las secciones", async ({ page }) => {
  const usuario = await crearUsuario("superadmin");

  try {
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(usuario.correo);
    await page.getByLabel("Contraseña").fill(usuario.clave);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(page.getByText("Super administrador")).toBeVisible();

    for (const seccion of ["Contenido", "Insumos", "Clientes", "Usuarios", "Auditoría"]) {
      await expect(page.locator(`[data-seccion="${seccion}"]`)).toHaveAttribute(
        "data-permitido",
        "true",
      );
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un repartidor entra pero solo alcanza clientes", async ({ page }) => {
  const usuario = await crearUsuario("repartidor");

  try {
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(usuario.correo);
    await page.getByLabel("Contraseña").fill(usuario.clave);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(page.locator('[data-seccion="Clientes"]')).toHaveAttribute(
      "data-permitido",
      "true",
    );
    await expect(page.locator('[data-seccion="Insumos"]')).toHaveAttribute(
      "data-permitido",
      "false",
    );

    // Y si escribe la URL a mano, el proxy lo devuelve al tablero.
    await page.goto("/admin/insumos");
    await expect(page).toHaveURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("una cuenta sin rol asignado entra pero no ve el panel", async ({ page }) => {
  // Alta sin metadatos: el trigger la crea inactiva y el hook le emite rol nulo.
  const usuario = await crearUsuario(null);

  try {
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(usuario.correo);
    await page.getByLabel("Contraseña").fill(usuario.clave);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/motivo=sin-permisos/);
    await expect(page.getByTestId("motivo-ingreso")).toContainText("todavía no tiene permisos");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("cerrar sesion devuelve al ingreso y corta el acceso", async ({ page }) => {
  const usuario = await crearUsuario("administrador");

  try {
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(usuario.correo);
    await page.getByLabel("Contraseña").fill(usuario.clave);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/admin");

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/ingresar");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/ingresar\?volver=/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
