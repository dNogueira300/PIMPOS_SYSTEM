import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario, type UsuarioDePrueba } from "./ayudas/usuarios";

/**
 * Las rutas del panel que existen. Cada tarea añade las suyas: axe y el área
 * táctil las recorren todas, a 375 px y en escritorio, sin desactivar reglas.
 */
export const RUTAS_DEL_PANEL = [
  "/admin",
  "/admin/contenido",
  "/admin/contenido/categorias",
  "/admin/contenido/categorias/nueva",
  "/admin/contenido/productos",
  "/admin/contenido/productos/nuevo",
  "/admin/contenido/novedades",
  "/admin/contenido/novedades/nueva",
  "/admin/contenido/portada",
  "/admin/contenido/portada/nueva",
  "/admin/contenido/galeria",
  "/admin/contenido/galeria/nueva",
  "/admin/contenido/preguntas",
  "/admin/contenido/preguntas/nueva",
  "/admin/contenido/guias",
  "/admin/contenido/guias/nueva",
  "/admin/contenido/testimonios",
  "/admin/contenido/testimonios/nueva",
  "/admin/insumos",
  "/admin/insumos/nuevo",
  "/admin/insumos/proveedores",
  "/admin/insumos/proveedores/nuevo",
  "/admin/usuarios",
  "/admin/usuarios/nuevo",
  "/admin/configuracion",
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

/**
 * Una ruta por prueba, no una prueba que recorre todas las rutas.
 *
 * Hasta la ronda 1 de la tarea 3, «el panel no tiene errores de axe» y «todo
 * control mide 44 px» eran un solo test con un bucle por dentro: con las 6
 * rutas de entonces ya tardaba 18.4 s de los 30 s del timeout por defecto, sin
 * ninguna carga. Las tareas 4-7 añaden novedades, portada, galería, preguntas,
 * guías, testimonios, usuarios y configuración — la prueba no iba a sobrevivir
 * a la fase, y encima un fallo en la ruta 2 no dejaba correr la 3 a la 6.
 * Partiéndola en un `test()` por ruta, el presupuesto de tiempo, el reintento
 * y el mensaje de fallo son por ruta: crecer en rutas ya no acerca un techo
 * fijo, y una ruta rota no oculta a las demás. El inicio de sesión va en
 * `beforeEach`/`afterEach` en vez de una sola vez para todo el archivo: así
 * cada prueba es independiente de verdad (nada que una ruta deje mal montado
 * en la sesión salpica a la siguiente), a cambio de un inicio de sesión de
 * más por ruta — barato frente al problema que resuelve.
 */
test.describe("axe en cada ruta del panel", () => {
  let usuario: UsuarioDePrueba;

  test.beforeEach(async ({ page }) => {
    usuario = await entrarComo(page, "superadmin");
  });

  test.afterEach(async () => {
    await borrarUsuario(usuario.id);
  });

  for (const ruta of RUTAS_DEL_PANEL) {
    test(`axe en ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      // El <Suspense> del layout sirve el titulo "Cargando el panel..." antes
      // de que llegue la sesion: axe tiene que medir la pantalla real.
      await page.locator("main#contenido").waitFor();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations, `axe en ${ruta}`).toEqual([]);
    });
  }
});

test.describe("area tactil en cada ruta del panel", () => {
  let usuario: UsuarioDePrueba;

  test.beforeEach(async ({ page }) => {
    usuario = await entrarComo(page, "superadmin");
  });

  test.afterEach(async () => {
    await borrarUsuario(usuario.id);
  });

  for (const ruta of RUTAS_DEL_PANEL) {
    test(`controles de al menos 44 × 44 px en ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      await page.locator("main#contenido").waitFor();
      expect(await controlesPequenos(page), `controles pequeños en ${ruta}`).toEqual([]);
    });
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
