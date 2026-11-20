import { test } from "@playwright/test";

import { sqlLocal } from "./ayudas/base";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Antes del sitio público, ninguna temática encendida (plan 08, T4).
 *
 * La migración deja Navidad del 1 al 26 de diciembre: una suite que corra en
 * esas fechas encontraría el sitio de fiesta, y las pruebas que miran colores o
 * el texto de la barra fallarían sin que nada estuviera roto. Se apaga desde
 * el panel y no por SQL, porque solo el «Guardar» refresca la caché del sitio.
 * Fuera de temporada no hace nada. El proyecto `tematicas`, que corre al final,
 * la deja «según fechas».
 */
test("ninguna temática encendida mientras se prueba el sitio público", async ({ page }) => {
  const activa = sqlLocal("select slug from public.tematica_publica").trim();
  if (!activa) return;

  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/contenido/tematicas/${activa}`);
    await page
      .getByRole("tabpanel", { name: "Cuándo" })
      .getByRole("radio", { name: /^Apagada/ })
      .check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/contenido/tematicas");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
