import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const unico = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

test("un ingeniero crea un producto, lo publica y el sitio lo muestra sin redesplegar", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "ingeniero");
  const nombre = `Pan E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Categoría").selectOption({ label: "Panes clásicos" });

    await page.getByRole("tab", { name: "Fotos" }).click();
    await expect(page.locator("[data-fotos-bloqueadas]")).toContainText(
      "Primero guarda el producto",
    );

    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1", { exact: true }).fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("0,35");
    await page.getByRole("button", { name: "Otra presentación" }).click();
    await page.getByLabel("Presentación 2", { exact: true }).fill("Docena");
    await page.getByLabel("Precio (S/)").nth(1).fill("4");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado como borrador")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/contenido\/productos\/[0-9a-f-]{36}$/);

    // Ya con id: la foto se sube en el momento.
    await page.getByRole("tab", { name: "Fotos" }).click();
    // `SubidaImagen` incluye la etiqueta en el nombre accesible; con una sola
    // subida en pantalla, una expresión regular basta para encontrarla.
    await page.getByLabel(/Elegir de la galería/).setInputFiles(await fotoDePrueba(page));
    await expect(page.getByText("Foto añadida.")).toBeVisible();
    await expect(page.locator("[data-foto]")).toHaveCount(1);

    await page.getByRole("tab", { name: "Datos" }).click();
    await page.getByRole("switch", { name: /Publicado/ }).check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    // updateTag('catalogo'): la siguiente visita al catálogo ya lo trae.
    await page.goto("/productos");
    await expect(page.getByText(nombre).first()).toBeVisible();
    await expect(page.getByText("S/ 0.35").first()).toBeVisible();
  } finally {
    await borrarDeLaBase("productos", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("un precio con letras se marca en la pestaña Precios aunque se esté en Datos", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(`Pan malo ${unico()}`);
    await page.getByLabel("Categoría").selectOption({ label: "Panes clásicos" });
    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1", { exact: true }).fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("diez");
    await page.getByRole("tab", { name: "Datos" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Precios/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(page.getByText("Escribe el precio con números, por ejemplo 0.40.")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("cambiar un precio deja constancia en el historial", async ({ page }) => {
  // Se comprueba en la base: el historial no tiene pantalla en F4.
  const usuario = await entrarComo(page, "administrador");
  const nombre = `Pan historial ${unico()}`;
  try {
    await page.goto("/admin/contenido/productos/nuevo");
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Categoría").selectOption({ label: "Panes clásicos" });
    await page.getByRole("tab", { name: "Precios" }).click();
    await page.getByLabel("Presentación 1", { exact: true }).fill("Unidad");
    await page.getByLabel("Precio (S/)").fill("1.00");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL(/productos\/[0-9a-f-]{36}$/);
    await page.getByRole("heading", { name: nombre }).waitFor();

    await page.getByRole("tab", { name: "Precios" }).click();
    // El router de Next mantiene la página de "nuevo" montada (oculta, con su
    // propia pestaña Precios en `data-state=inactive`) para volver atrás al
    // instante: esa copia sigue teniendo un campo "Precio (S/)" con el mismo
    // valor "1.00" recién escrito. `getByLabel` no filtra por visibilidad al
    // resolver el locator, así que buscarlo en toda la página es un choque de
    // modo estricto **siempre**, no una carrera puntual. `getByRole` sí excluye
    // lo que `display:none` saca del árbol de accesibilidad (la copia oculta lo
    // está, por nuestra propia regla `data-[state=inactive]:hidden`), así que
    // escopar por el `tabpanel` activo antes de buscar la etiqueta lo evita.
    await page.getByRole("tabpanel", { name: "Precios" }).getByLabel("Precio (S/)").fill("1.20");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/productos");

    const { supabaseLocal } = await import("./ayudas/supabase-local");
    const { apiUrl, serviceRoleKey } = supabaseLocal();
    const r = await fetch(
      `${apiUrl}/rest/v1/productos?nombre=eq.${encodeURIComponent(nombre)}&select=producto_variantes(precio_historial(precio))`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
    );
    const [fila] = (await r.json()) as {
      producto_variantes: { precio_historial: { precio: number }[] }[];
    }[];
    expect(
      fila?.producto_variantes[0]?.precio_historial.map((h) => Number(h.precio)).sort(),
    ).toEqual([1, 1.2]);
  } finally {
    await borrarDeLaBase("productos", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});
