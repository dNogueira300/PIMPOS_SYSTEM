import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Las rutas del panel que existen. Cada tarea añade las suyas: axe y el área
 * táctil las recorren todas, a 375 px y en escritorio, sin desactivar reglas.
 */
export const RUTAS_DEL_PANEL = [
  "/admin",
  "/admin/contenido",
  "/admin/contenido/categorias",
  "/admin/contenido/categorias/nueva",
];

/** Los controles interactivos por debajo de 44 x 44 px, con su HTML para identificarlos. */
async function controlesPequenos(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [role=tab]")]
      .filter((el) => el.offsetParent !== null && el.getAttribute("type") !== "hidden")
      .map((el) => ({ el, caja: el.getBoundingClientRect() }))
      .filter(({ caja }) => caja.width < 44 || caja.height < 44)
      .map(({ el }) => el.outerHTML.slice(0, 120)),
  );
}

test("el panel no tiene errores de axe", async ({ page }) => {
  const usuario = await entrarComo(page, "superadmin");
  try {
    for (const ruta of RUTAS_DEL_PANEL) {
      await page.goto(ruta);
      // El <Suspense> del layout sirve el titulo "Cargando el panel..." antes
      // de que llegue la sesion: axe tiene que medir la pantalla real.
      await page.locator("main#contenido").waitFor();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations, `axe en ${ruta}`).toEqual([]);
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("todo control del panel mide al menos 44 × 44 px", async ({ page }) => {
  const usuario = await entrarComo(page, "superadmin");
  try {
    for (const ruta of RUTAS_DEL_PANEL) {
      await page.goto(ruta);
      await page.locator("main#contenido").waitFor();
      expect(await controlesPequenos(page), `controles pequeños en ${ruta}`).toEqual([]);
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el «Más» del celular no tiene errores de axe ni controles pequeños", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "movil", "la barra inferior solo existe en el celular");
  const usuario = await entrarComo(page, "superadmin");
  try {
    await page.goto("/admin");
    await page.locator("main#contenido").waitFor();
    // El barrido de arriba nunca abre "Más": por eso un boton de cierre de
    // 28 px se coló sin que nada lo viera.
    await page.getByRole("button", { name: "Más" }).click();
    // `exact: true`: "Cerrar" sin él tambien encuentra "Cerrar sesión".
    await page.getByRole("button", { name: "Cerrar", exact: true }).waitFor();

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations, "axe en «Más»").toEqual([]);
    expect(await controlesPequenos(page), "controles pequeños en «Más»").toEqual([]);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
