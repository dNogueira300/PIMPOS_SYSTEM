import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("el ingeniero crea un insumo con su equivalencia y lo ve en Existencias", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const nombre = `Coco rallado ${Date.now()}`;
  try {
    await page.goto("/admin/insumos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Se cuenta en").selectOption({ label: "Kilogramo" });
    await page.getByLabel("Stock mínimo (en kg)").fill("10");
    await page.getByRole("button", { name: "Añadir unidad de compra" }).click();
    await page.getByLabel("Unidad 1").selectOption({ label: "1 bolsa" });
    await page.getByLabel("= cuántos kg").fill("5");
    await page.getByRole("button", { name: "Guardar" }).click();

    await page.waitForURL("/admin/insumos");
    await page.getByLabel("Buscar insumo").fill(nombre);
    await page.getByRole("button", { name: "Buscar" }).click();
    const fila = page.getByRole("list", { name: "Existencias de insumos" }).getByText(nombre);
    const tabla = page.getByRole("table", { name: "Existencias de insumos" }).getByText(nombre);
    await expect(fila.or(tabla)).toBeVisible();
    // Sin acotar a la lista o la tabla, `getByText` también encuentra la
    // opción «Bajo el mínimo» del filtro «Mostrar», oculta dentro de su
    // <select> — el mismo texto existe dos veces en la página.
    const avisoLista = page
      .getByRole("list", { name: "Existencias de insumos" })
      .getByText("Bajo el mínimo");
    const avisoTabla = page
      .getByRole("table", { name: "Existencias de insumos" })
      .getByText("Bajo el mínimo");
    await expect(avisoLista.or(avisoTabla)).toBeVisible();
  } finally {
    // Sin esto, cada corrida deja un insumo real en la base: `0011_insumos.
    // test.sql` cuenta los 22 de la ficha 7.2 y falla en cuanto sobra uno
    // (equivalencias se va sola por el `on delete cascade` de 0011).
    await borrarDeLaBase("insumos", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("el repartidor no ve la sección de insumos", async ({ page }) => {
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto("/admin/insumos");
    await page.waitForURL(/\/admin\?motivo=sin-acceso/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
