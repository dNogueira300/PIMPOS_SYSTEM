import { expect, test, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Buscar filtra mientras se escribe, sin Enter ni botón y sin recargar la
 * página (Dan, 29/09/2026). Para saber que no se recargó, se deja una marca en
 * `window`: una recarga completa la borra; una navegación del App Router no.
 */
async function marcar(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __sinRecargar?: boolean }).__sinRecargar = true;
  });
}
async function sigueMarcada(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __sinRecargar?: boolean }).__sinRecargar === true,
  );
}

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "el buscador es el mismo en los dos tamaños");
});

test("productos: filtra al escribir, sin Enter y sin recargar", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos");
    const lista = page.getByRole("list", { name: "Productos del catálogo" });
    await expect(lista.getByRole("listitem").first()).toBeVisible();
    await marcar(page);

    await page.getByRole("searchbox", { name: "Buscar producto" }).pressSequentially("zzz");
    await expect(page.getByText("Ningún producto coincide con la búsqueda.")).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=zzz/);
    expect(await sigueMarcada(page)).toBe(true);

    await page.getByRole("searchbox", { name: "Buscar producto" }).clear();
    await expect(lista.getByRole("listitem").first()).toBeVisible();
    expect(await sigueMarcada(page)).toBe(true);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("productos: la categoría filtra al elegirla", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos");
    await marcar(page);
    const categoria = page.getByRole("combobox", { name: "Categoría" });
    const valor = await categoria.locator("option").nth(1).getAttribute("value");
    await categoria.selectOption(valor!);
    await expect(page).toHaveURL(new RegExp(`[?&]categoria=${valor}`));
    expect(await sigueMarcada(page)).toBe(true);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("insumos: filtra al escribir, sin Enter y sin recargar", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/insumos");
    const lista = page.getByRole("list", { name: "Existencias de insumos" });
    await expect(lista.getByRole("listitem").filter({ hasText: "Harina" }).first()).toBeVisible();
    await marcar(page);

    await page.getByRole("searchbox", { name: "Buscar insumo" }).pressSequentially("Sal");
    await expect(lista.getByRole("listitem").filter({ hasText: "Harina" })).toHaveCount(0);
    await expect(lista.getByRole("listitem").filter({ hasText: "Sal" }).first()).toBeVisible();
    expect(await sigueMarcada(page)).toBe(true);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
