import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("el ingeniero ve inicio y contenido, y no usuarios ni configuración", async ({
  page,
}, info) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    const nav =
      info.project.name === "movil"
        ? page.getByRole("navigation", { name: "Secciones del panel, en la barra inferior" })
        : page.getByRole("navigation", { name: "Secciones del panel" });

    await expect(nav.getByRole("link", { name: "Inicio" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contenido" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Usuarios" })).toHaveCount(0);

    await nav.getByRole("link", { name: "Contenido" }).click();
    await expect(page).toHaveURL("/admin/contenido");
    await expect(nav.getByRole("link", { name: "Contenido" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("en el celular, «Más» lleva a configuración y a cerrar sesión", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "la barra inferior solo existe en el celular");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.getByRole("button", { name: "Más" }).click();
    await expect(page.getByRole("link", { name: "Configuración" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/ingresar");
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("la barra inferior no tapa el final de la página", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "solo en el celular");
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // `main#contenido` y no `main` a secas: el enrutador del App Router deja
    // montado (con tamaño 0, oculto) el <main> de /ingresar para la cache de
    // navegacion, y un selector generico recoge su ultimo hijo en vez del de
    // la pantalla real.
    const ultimo = page.locator("main#contenido > *").last();
    const caja = await ultimo.boundingBox();
    const barra = await page
      .getByRole("navigation", { name: "Secciones del panel, en la barra inferior" })
      .boundingBox();
    expect(caja && barra && caja.y + caja.height <= barra.y).toBe(true);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
