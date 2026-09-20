import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const nombreUnico = () => `Categoría E2E ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

test("crear una categoría con foto: se comprime, se sube y el bucket la sirve", async ({
  page,
  request,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = nombreUnico();
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill(nombre);

    await page.getByRole("tab", { name: "Foto" }).click();
    await page.getByLabel("Elegir de la galería").setInputFiles(await fotoDePrueba(page));
    // Se espera a la vista previa y no a `data-fase`: la fase empieza en «quieta»
    // y la comprobación pasaría antes de subir nada.
    await expect(page.locator("[data-vista-previa]")).toHaveAttribute(
      "src",
      /\/storage\/v1\/object\/public\/productos\/categorias\/.+\.webp$/,
    );
    const src = await page.locator("[data-vista-previa]").getAttribute("src");

    // Lo que se comprueba es el archivo del bucket, no el <img>.
    const archivo = await request.get(src ?? "");
    expect(archivo.status()).toBe(200);
    expect(archivo.headers()["content-type"]).toBe("image/webp");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/categorias");
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();
    await expect(page.getByRole("link", { name: nombre }).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("categorias_producto", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("lo escrito sobrevive a una recarga y se puede recuperar", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill("Panes de prueba sin guardar");
    await page.waitForTimeout(1000); // la copia se guarda a los 800 ms de dejar de escribir
    await page.reload();

    await expect(page.locator("[data-borrador]")).toContainText("Tienes cambios sin guardar");
    await expect(page.getByLabel("Nombre")).toHaveValue("");
    await page.getByRole("button", { name: "Recuperarlos" }).click();
    await expect(page.getByLabel("Nombre")).toHaveValue("Panes de prueba sin guardar");

    await page.getByRole("link", { name: "Cancelar" }).click();
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByRole("button", { name: "Descartar" }).click();
    await page.reload();
    await expect(page.locator("[data-borrador]")).toHaveCount(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un error en una pestaña que no se ve la marca y salta a ella", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByRole("tab", { name: "Foto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    const datos = page.getByRole("tab", { name: /Datos/ });
    await expect(datos).toHaveAttribute("data-con-error", "true");
    await expect(datos).toHaveAttribute("data-state", "active");
    await expect(page.getByText("Escribe el nombre de la categoría.")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("borrar pide confirmación nombrando la categoría", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = nombreUnico();
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/categorias");

    await page
      .getByRole("button", { name: `Borrar la categoría ${nombre}` })
      .first()
      .click();
    await expect(page.getByRole("alertdialog")).toContainText(`¿Borrar la categoría ${nombre}?`);
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page.getByText("Categoría borrada.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);
  } finally {
    await borrarDeLaBase("categorias_producto", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});
