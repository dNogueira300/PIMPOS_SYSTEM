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
    // El nombre accesible lleva la etiqueta del uploader (`para ${etiqueta}`)
    // para que dos <SubidaImagen> en la misma pantalla no compartan nombre
    // (T3 y T7 tienen más de una); por eso es una expresión, no el texto
    // exacto.
    await page.getByLabel(/Elegir de la galería/).setInputFiles(await fotoDePrueba(page));
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

test("las dos formas de elegir foto muestran un indicador de foco visible", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/categorias/nueva");
    await page.getByRole("tab", { name: "Foto" }).click();
    // Radix hace focusable el propio `[role=tabpanel]` (patrón WAI-ARIA APG),
    // así que el primer `Tab` después del disparador de la pestaña aterriza
    // ahí, no en el primer control de dentro. Se consume aparte.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tabpanel")).toBeFocused();

    for (const nombreAccesible of [/Tomar foto/, /Elegir de la galería/]) {
      // `.focus()` programático no basta: Chromium solo activa `:focus-visible`
      // con una interacción real de teclado (probado: con `.focus()` el input
      // queda enfocado pero `:focus-visible` da `false`). `Tab` es la forma en
      // que una persona que no usa el mouse llega de verdad a este control.
      await page.keyboard.press("Tab");
      const control = page.getByLabel(nombreAccesible);
      await expect(control, `Tab debía llegar a «${nombreAccesible}»`).toBeFocused();
      // El `<input type=file>` real es invisible (`opacity-0`): un anillo de
      // foco puesto sobre él no se vería. El indicador tiene que estar en el
      // botón decorativo de al lado (WCAG 2.1 AA 2.4.7).
      const indicador = await control.evaluate((el) => {
        const decorativo = el.parentElement?.querySelector('[aria-hidden="true"]');
        if (!decorativo) throw new Error("no se encontró el botón decorativo junto al input");
        const estilo = getComputedStyle(decorativo);
        return { outlineStyle: estilo.outlineStyle, outlineWidth: estilo.outlineWidth };
      });
      expect(indicador.outlineStyle, `foco de «${nombreAccesible}»`).not.toBe("none");
      expect(indicador.outlineWidth, `foco de «${nombreAccesible}»`).not.toBe("0px");
    }
  } finally {
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
