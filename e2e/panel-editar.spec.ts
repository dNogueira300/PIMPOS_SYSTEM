import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Editar no se descubría: había que saber que el nombre era un enlace (Dan,
 * 29/09/2026). Cada lista del panel lleva ahora un lápiz «Editar …» junto al
 * de borrar, en una columna «Acción». Se prueba como superadmin, que es quien
 * lo echó en falta y el único rol que ninguna prueba usaba para editar.
 */
const LISTAS = [
  {
    ruta: "/admin/contenido/categorias",
    destino: /\/admin\/contenido\/categorias\/[0-9a-f-]{36}$/,
  },
  { ruta: "/admin/contenido/productos", destino: /\/admin\/contenido\/productos\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/contenido/novedades", destino: /\/admin\/contenido\/novedades\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/contenido/portada", destino: /\/admin\/contenido\/portada\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/contenido/galeria", destino: /\/admin\/contenido\/galeria\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/contenido/preguntas", destino: /\/admin\/contenido\/preguntas\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/contenido/guias", destino: /\/admin\/contenido\/guias\/[0-9a-f-]{36}$/ },
  {
    ruta: "/admin/contenido/testimonios",
    destino: /\/admin\/contenido\/testimonios\/[0-9a-f-]{36}$/,
  },
  // En insumos el nombre lleva a la ficha (kárdex); el lápiz, a editar sus datos.
  { ruta: "/admin/insumos", destino: /\/admin\/insumos\/[0-9a-f-]{36}\/editar$/ },
  { ruta: "/admin/insumos/proveedores", destino: /\/admin\/insumos\/proveedores\/[0-9a-f-]{36}$/ },
  { ruta: "/admin/usuarios", destino: /\/admin\/usuarios\/[0-9a-f-]{36}$/ },
] as const;

test("cada fila de cada lista tiene su lápiz de editar, y lleva al formulario", async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  const usuario = await entrarComo(page, "superadmin");
  try {
    for (const { ruta, destino } of LISTAS) {
      await page.goto(ruta);
      const lista = page.locator("main#contenido");
      const editar = lista.getByRole("link", { name: /^Editar / });
      const filas =
        info.project.name === "movil"
          ? lista.locator("ul[aria-label] > li")
          : lista.locator("tbody tr");
      if (ruta === "/admin/contenido/novedades") {
        // La base de pruebas empieza sin novedades: si sigue vacía, no hay qué editar.
        await page.waitForLoadState("networkidle");
        if ((await filas.count()) === 0) continue;
      } else {
        // El resto trae filas de la semilla. Esperarlas: la lista llega en
        // streaming, y contar antes de que llegue daba cero y se saltaba todo.
        await expect(filas.first(), `${ruta}: la lista tiene filas`).toBeVisible();
      }
      const cuantas = await filas.count();
      await expect(editar, `${ruta}: un lápiz por fila`).toHaveCount(cuantas);
      if (info.project.name !== "movil") {
        await expect(lista.getByRole("columnheader", { name: "Acción" })).toBeVisible();
      }
      await editar.first().click();
      await expect(page, `${ruta}: el lápiz abre la edición`).toHaveURL(destino);
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el lápiz dice qué edita, para quien usa lector de pantalla", async ({ page }) => {
  const usuario = await entrarComo(page, "superadmin");
  try {
    await page.goto("/admin/contenido/categorias");
    const primera = page
      .locator("main#contenido")
      .getByRole("link", { name: /^Editar / })
      .first();
    await expect(primera).toHaveAccessibleName(/^Editar \S/);
  } finally {
    await borrarUsuario(usuario.id);
  }
});
