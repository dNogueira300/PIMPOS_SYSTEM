import { expect, test, type Page } from "@playwright/test";

// Página real e hidratada: estos casos complementan los extremos SSR de
// carrusel-estados, que solo comprueban composición. También se ejecutan desde
// el proyecto móvil a ancho de escritorio: el carrusel existe desde 640 px.
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

const carrusel = (page: Page) => page.locator('[aria-roledescription="carrusel"]');
const slide = (page: Page, numero: number) =>
  carrusel(page).locator(`[aria-roledescription="diapositiva"][aria-label="${numero} de 3"]`);

async function abrir(page: Page, reducedMotion: "reduce" | "no-preference") {
  await page.emulateMedia({ reducedMotion });
  await page.clock.install();
  await page.goto("/");
  // Una transición real confirma que Embla y los handlers están hidratados.
  await carrusel(page).getByRole("button", { name: "Ir a la diapositiva 2", exact: true }).click();
  await expect(slide(page, 2)).toHaveAttribute("aria-hidden", "false");
  await carrusel(page).getByRole("button", { name: "Ir a la diapositiva 1", exact: true }).click();
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
}

async function salir(page: Page) {
  await page
    .getByRole("banner")
    .getByRole("link", { name: /ir al inicio/ })
    .focus();
  await page.mouse.move(0, 0);
}

test("flechas e indicadores cambian el slide y el enlace disponible", async ({ page }) => {
  await abrir(page, "reduce");
  const botones = carrusel(page).getByRole("button");
  await botones.filter({ hasText: "Siguiente" }).click();
  await expect(slide(page, 2)).toHaveAttribute("aria-hidden", "false");
  await expect(slide(page, 1).locator("a")).toHaveAttribute("tabindex", "-1");
  await expect(slide(page, 2).locator("a")).not.toHaveAttribute("tabindex", "-1");
  await expect(
    carrusel(page).getByRole("button", { name: "Ir a la diapositiva 2", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await botones.filter({ hasText: "Anterior" }).click();
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
  await carrusel(page).getByRole("button", { name: "Ir a la diapositiva 3", exact: true }).click();
  await expect(slide(page, 3)).toHaveAttribute("aria-hidden", "false");
  await expect(slide(page, 3).locator("a")).toHaveAttribute("href", "/nosotros");
  await slide(page, 3).locator("a").click();
  await expect(page).toHaveURL(/\/nosotros$/);
});

test("el avance automático mantiene el intervalo de seis segundos", async ({ page }) => {
  await abrir(page, "no-preference");
  await salir(page);
  await page.clock.runFor(5000);
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
  await page.clock.runFor(1500);
  await expect(slide(page, 2)).toHaveAttribute("aria-hidden", "false");
});

test("hover y foco de teclado pausan el avance y permiten reanudarlo", async ({ page }) => {
  await abrir(page, "no-preference");
  await salir(page);
  await carrusel(page).hover();
  await page.clock.runFor(12500);
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
  await slide(page, 1).locator("a").focus();
  await page.mouse.move(0, 0);
  // Salir con el ratón dispara la misma actualización del estado existente;
  // reenfocar el enlace establece la pausa de teclado de forma independiente.
  await page
    .getByRole("banner")
    .getByRole("link", { name: /ir al inicio/ })
    .focus();
  await slide(page, 1).locator("a").focus();
  await page.clock.runFor(12500);
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
  await salir(page);
  await page.clock.runFor(6500);
  await expect(slide(page, 2)).toHaveAttribute("aria-hidden", "false");
});

test("movimiento reducido evita avance automático pero conserva navegación manual", async ({
  page,
}) => {
  await abrir(page, "reduce");
  await salir(page);
  await page.clock.runFor(12500);
  await expect(slide(page, 1)).toHaveAttribute("aria-hidden", "false");
  await carrusel(page).getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(slide(page, 2)).toHaveAttribute("aria-hidden", "false");
});
