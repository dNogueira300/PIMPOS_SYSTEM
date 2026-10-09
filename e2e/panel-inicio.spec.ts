import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const ACCESOS = {
  Contenido: "/admin/contenido",
  Insumos: "/admin/insumos",
  Clientes: "/admin/clientes",
  Usuarios: "/admin/usuarios",
  Historial: "/admin/auditoria",
  Configuración: "/admin/configuracion",
} as const;

for (const [rol, nombres] of [
  ["administrador", ["Contenido", "Insumos", "Clientes", "Usuarios", "Historial", "Configuración"]],
  ["ingeniero", ["Contenido", "Insumos", "Clientes"]],
  ["repartidor", ["Clientes"]],
] as const) {
  test(`inicio de ${rol}: conserva los nombres accesibles y destinos de sus secciones`, async ({
    page,
  }) => {
    const usuario = await entrarComo(page, rol);
    try {
      await expect(page.locator("[data-seccion]")).toHaveCount(nombres.length);
      for (const nombre of nombres) {
        const enlace = page.locator(`[data-seccion="${nombre}"]`);
        await expect(enlace).toHaveAccessibleName(nombre);
        await expect(enlace).toHaveAttribute("href", ACCESOS[nombre]);
      }
      if (rol !== "administrador")
        await expect(page.locator("[data-actividad-reciente]")).toHaveCount(0);
      if (rol === "repartidor") await expect(page.locator("[data-aviso]")).toHaveCount(0);
    } finally {
      await borrarUsuario(usuario.id);
    }
  });
}

test("cantidades amplias no se superponen al texto del aviso en móvil", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.setViewportSize({ width: 375, height: 844 });
    const aviso = page.locator("[data-aviso]").first();
    await expect(aviso).toBeVisible();
    // Solo una fixture de presentación en este navegador; no se alteran cuentas
    // ni avisos en la base. El conteo real y sus destinos tienen otras regresiones.
    await aviso
      .locator(":scope > span")
      .first()
      .evaluate((el) => {
        el.textContent = "1000";
      });
    await page.evaluate(() => document.fonts.ready);
    const geometria = await aviso.evaluate((el) => {
      const [cantidad, texto] = el.querySelectorAll(":scope > span");
      const rango = document.createRange();
      rango.selectNodeContents(cantidad);
      const cifras = rango.getBoundingClientRect();
      const descripcion = texto.getBoundingClientRect();
      return {
        separados: cifras.right <= descripcion.left,
        cabe: document.documentElement.scrollWidth <= innerWidth,
      };
    });
    expect(geometria).toEqual({ separados: true, cabe: true });
  } finally {
    await borrarUsuario(usuario.id);
  }
});
