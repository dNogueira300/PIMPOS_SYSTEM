import { expect, test } from "@playwright/test";

// Extremos visuales sobre el DOM real: no alteran catálogo, precios ni caché.
// Las suites presentaciones/pedido/pizarra siguen comprobando los datos reales.
test("nombres y precios largos de las presentaciones se leen sin superponerse", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/productos/hamburguesa-grande");
  await page
    .locator("[data-presentaciones] li")
    .first()
    .evaluate((fila) => {
      fila.children[0].textContent =
        "Presentación familiar para compartir con todos los vecinos del barrio";
      fila.children[2].textContent = "S/ 999,999.99";
    });
  for (const width of [375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const legible = await page
      .locator("[data-presentaciones] li")
      .first()
      .evaluate((fila) => {
        const nombre = fila.children[0].getBoundingClientRect();
        const precio = fila.children[2].getBoundingClientRect();
        return (
          nombre.right <= precio.left &&
          precio.right <= fila.getBoundingClientRect().right &&
          document.documentElement.scrollWidth <= innerWidth
        );
      });
    expect(legible, `presentación sin superposición a ${width}px`).toBe(true);
  }
});

test("la pizarra conserva nombre y precio largos dentro de la página", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/productos?categoria=panes-clasicos");
  const fila = page
    .locator("main li")
    .filter({ has: page.locator("[data-nombre]") })
    .first();
  await fila
    .locator("[data-nombre] > span")
    .first()
    .evaluate((e) => {
      e.textContent = "PanFamiliarEspecialPreparadoParaCompartirConTodosLosVecinosDelBarrio";
    });
  await fila.locator("[data-precio]").evaluate((e) => {
    e.textContent = "Desde S/ 999,999.99";
  });
  for (const width of [375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const legible = await fila.evaluate((e) => {
      const caja = e.getBoundingClientRect();
      const nombre = e.querySelector("[data-nombre]")!.getBoundingClientRect();
      const precio = e.querySelector("[data-precio]")!.getBoundingClientRect();
      return (
        nombre.width > 30 &&
        nombre.right <= caja.right &&
        precio.right <= caja.right &&
        (nombre.right <= precio.left || nombre.bottom <= precio.top) &&
        document.documentElement.scrollWidth <= innerWidth
      );
    });
    expect(legible, `pizarra sin recorte a ${width}px`).toBe(true);
  }
});
