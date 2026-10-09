/* eslint-disable @typescript-eslint/no-require-imports -- Evidencia local de efectos visuales aprobados. */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve("DOC/Maquetas/3.2/bloque4/ajustes-movimiento");

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const resultados = [];
  try {
    for (const width of [375, 390, 768, 1024, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: width < 640 ? 844 : 1000 },
        reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:3000/");
      // Igual que la suite de axe: medir el contenido estable, no su opacidad
      // intermedia al entrar con scroll. El recorrido de la moto sigue activo.
      await page.addStyleTag({
        content:
          ".aparece,.aparece-lateral,.acercarse,.aparece-grupo > *{animation:none!important;transition:none!important}",
      });
      const pista = page.locator("[data-recorrido-delivery]");
      await pista.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => document.querySelector("[data-moto-delivery]").getAnimations().length === 1,
      );
      await page.locator("[data-moto-delivery]").evaluate((el) => {
        const animacion = el.getAnimations()[0];
        animacion.pause();
        animacion.currentTime = 2000;
      });
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator("section[aria-labelledby='titulo-delivery']")
        .screenshot({ path: path.join(out, `delivery-${width}.png`) });
      const axe = (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations.map((v) => v.id);
      resultados.push(
        await pista.evaluate(
          (el, arg) => ({
            width: arg.width,
            axe: arg.axe,
            overflow: document.documentElement.scrollWidth > innerWidth,
            color: getComputedStyle(el).color,
            backgroundToken: getComputedStyle(document.documentElement)
              .getPropertyValue("--background")
              .trim(),
            note: "Fotograma detenido a 2 s exclusivamente para esta captura; E2E comprueba el recorrido real.",
          }),
          { width, axe },
        ),
      );
      await context.close();
    }
    const photos = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    });
    const page = await photos.newPage();
    for (const [name, route, selector] of [
      ["galeria", "/galeria", "main figure img"],
      ["nosotros", "/nosotros", "main img"],
      ["producto", "/productos/frances-chico", "main img"],
    ]) {
      await page.goto("http://127.0.0.1:3000" + route);
      const foto = page.locator(selector).first();
      await foto.scrollIntoViewIfNeeded();
      await foto.evaluate((el) => el.decode());
      await page.mouse.move(0, 0);
      await page.screenshot({ path: path.join(out, `${name}-normal.png`) });
      await foto.hover();
      await page.waitForFunction(
        (selector) =>
          new DOMMatrixReadOnly(getComputedStyle(document.querySelector(selector)).transform).a >=
          1.029,
        selector,
      );
      await page.screenshot({ path: path.join(out, `${name}-hover.png`) });
    }
    await photos.close();
    const video = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "no-preference",
      recordVideo: { dir: out, size: { width: 390, height: 844 } },
    });
    const film = await video.newPage();
    await film.goto("http://127.0.0.1:3000/");
    await film.locator("[data-recorrido-delivery]").scrollIntoViewIfNeeded();
    await film.waitForFunction(
      () => document.querySelector("[data-moto-delivery]").getAnimations().length === 1,
    );
    await film.locator("[data-moto-delivery]").evaluate(async (el) => {
      await el.getAnimations()[0].finished;
    });
    const videoPath = await film.video().path();
    await video.close();
    fs.renameSync(videoPath, path.join(out, "delivery-movil.webm"));
    console.log(JSON.stringify(resultados, null, 2));
    fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(resultados, null, 2) + "\n");
    if (resultados.some((r) => r.overflow || r.axe.length)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
