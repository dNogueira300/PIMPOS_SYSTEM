import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

import type { Slide } from "@/lib/datos/contenido";

function renderizar(slides: Slide[]): string {
  return execFileSync(process.execPath, ["e2e/ayudas/renderizar-carrusel.cjs"], {
    input: JSON.stringify(slides),
    encoding: "utf8",
  });
}

test("sin diapositivas no aparece una región vacía de carrusel", () => {
  expect(renderizar([])).toBe("");
});

test("el contenido largo y la ausencia de foto no recortan texto ni enlaces", async ({ page }) => {
  const slide: Slide = {
    id: "prueba-de-composicion",
    titulo:
      "Pan fresco para compartir en casa, con los vecinos y en cada mesa del barrio de Iquitos",
    subtitulo:
      "El negocio puede escribir aquí una presentación más extensa de sus panes y condiciones de atención. El texto debe conservarse completo y el enlace debe seguir a mano, incluso cuando no se haya cargado una fotografía.",
    imagen: null,
    imagenMovil: null,
    alt: "",
    enlace: "/productos",
    textoBoton: "Ver el catálogo y sus precios",
    enfoque: 50,
  };
  const html = renderizar([slide]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const marco = await page.evaluate(() => ({
    css: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
      .map((link) => `<link rel="stylesheet" href="${link.href}">`)
      .join(""),
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
  }));
  const url = new URL("/__prueba-carrusel__", page.url()).href;
  await page.route(url, (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="es" class="${marco.htmlClass}"><head><meta charset="utf-8">${marco.css}</head><body class="${marco.bodyClass}">${html}</body></html>`,
    }),
  );
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Documento aislado con SSR real y CSS del build, sin una hidratación de la
    // portada que reemplace la fixture. No se toca base, caché ni servidor.
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const region = page.locator('[aria-roledescription="carrusel"]');
    await expect(region.getByRole("heading")).toHaveText(slide.titulo);
    await expect(region).toContainText(slide.subtitulo!);
    await expect(region.getByRole("link")).toHaveAttribute("href", "/productos");
    const cabe = await region.locator("[data-panel-hero]").evaluate((el) => {
      const panel = el.getBoundingClientRect();
      return (
        [...el.querySelector("[data-texto-hero]")!.children].every((h) => {
          const r = h.getBoundingClientRect();
          return (
            r.left >= panel.left &&
            r.right <= panel.right &&
            r.top >= panel.top &&
            r.bottom <= panel.bottom
          );
        }) && document.documentElement.scrollWidth <= innerWidth
      );
    });
    expect(cabe, String(width)).toBe(true);
  }
});
