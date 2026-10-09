import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario } from "./ayudas/usuarios";

test("la portada muestra completa la imagen de la novedad y conserva su enlace y resumen", async ({
  page,
}, info) => {
  test.slow();
  const usuario = await entrarComo(page, "administrador");
  const titulo = `Novedad visual E2E ${Date.now()}`;
  let imagen: string | null = null;
  let edicion: string | null = null;
  try {
    await page.goto("/admin/contenido/novedades/nueva");
    await page.getByLabel("Tipo", { exact: true }).selectOption("aviso");
    await page.getByLabel("Título", { exact: true }).fill(titulo);
    await page.getByLabel(/^Resumen/).fill("Pan recién horneado para compartir.");
    await page
      .getByLabel("Texto", { exact: true })
      .fill("Texto temporal de la prueba, sin nuevas condiciones ni ofertas.");
    await page.getByRole("tab", { name: "Imagen", exact: true }).click();
    await page.getByLabel(/Elegir de la galería/).setInputFiles(await fotoDePrueba(page));
    await expect(page.locator('input[name="imagen_url"]')).not.toHaveValue("");
    imagen = await page.locator('input[name="imagen_url"]').inputValue();
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByText("Publicada. Ya se ve en el sitio.")).toBeVisible();
    await page.goto("/admin/contenido/novedades");
    await page.getByRole("link", { name: titulo }).first().click();
    await page.waitForURL(/\/admin\/contenido\/novedades\/[0-9a-f-]{36}$/);
    edicion = page.url();
    await page.goto("/");
    const tarjeta = page
      .locator('section[aria-labelledby="titulo-novedades"]')
      .getByRole("link", { name: new RegExp(titulo) });
    await expect(tarjeta).toContainText("Pan recién horneado para compartir.");
    const foto = tarjeta.locator("img");
    await expect(foto).toHaveCount(1);
    await tarjeta.scrollIntoViewIfNeeded();
    await expect
      .poll(() => foto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    await expect(foto).toHaveCSS("object-fit", "contain");
    await tarjeta.screenshot({ path: `DOC/Maquetas/3.2/bloque5/novedad-${info.project.name}.png` });
    await tarjeta.click();
    await page.waitForURL(/\/novedades\/novedad-visual-e2e-/);
    await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
  } finally {
    try {
      if (edicion) {
        await page.goto(edicion);
        await page.getByRole("button", { name: "Retirar del sitio", exact: true }).click();
        await expect(page.getByText("Retirada del sitio.")).toBeVisible();
      }
    } finally {
      await borrarDeLaBase("novedades", "titulo", titulo);
      if (imagen) {
        const { apiUrl, serviceRoleKey } = supabaseLocal();
        const respuesta = await fetch(`${apiUrl}/storage/v1/object/slides`, {
          method: "DELETE",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: [imagen] }),
        });
        expect(respuesta.ok).toBe(true);
      }
      await borrarUsuario(usuario.id);
    }
  }
});
