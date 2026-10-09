import { expect, test } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test("las unidades del reporte se leen completas en tamaños intermedios", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    for (const width of [768, 1024]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/admin/insumos/reportes/existencias");
      const tabla = page.getByRole("table", { name: "Existencias y valorización" });
      await expect(tabla).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const unidades = tabla.locator("td").filter({ hasText: /^unidad$/ });
      expect(await unidades.count()).toBeGreaterThan(0);
      for (const unidad of await unidades.all()) {
        const lineas = await unidad.evaluate((el) => {
          const rango = document.createRange();
          rango.selectNodeContents(el);
          return [...rango.getClientRects()].filter((r) => r.width > 0).length;
        });
        expect(lineas, `La palabra unidad no debe cortarse a ${width} px`).toBe(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});
