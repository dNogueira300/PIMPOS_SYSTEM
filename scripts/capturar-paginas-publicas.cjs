/* eslint-disable @typescript-eslint/no-require-imports -- Evidencia local reproducible de T6, sin modificar datos. */
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");
const baseline = process.argv.includes("--base");
const out = path.resolve("DOC/Maquetas/3.2/bloque4", baseline ? "base" : "resultado");
const routes = [
  ["catalogo", "/productos"],
  ["detalle-foto", "/productos/frances-chico"],
  ["detalle-presentaciones", "/productos/hamburguesa-grande"],
  ["categoria-vacia", "/productos?categoria=sin-productos"],
  ["novedades", "/novedades"],
  ["nosotros", "/nosotros"],
  ["galeria", "/galeria"],
  ["ubicacion", "/ubicacion"],
  ["preguntas", "/preguntas-frecuentes"],
  ["contacto", "/contacto"],
  ["no-encontrado", "/esto-no-existe"],
];
fs.mkdirSync(out, { recursive: true });
const records = [];
(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ reducedMotion: "reduce", locale: "es-PE" });
    const page = await context.newPage();
    for (const [name, route] of baseline ? routes.slice(0, 3) : routes) {
      for (const width of baseline ? [390, 1440] : [375, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
        const response = await page.goto("http://127.0.0.1:3000" + route);
        await page.locator("main h1").waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (name === "ubicacion") await page.locator(".leaflet-control-zoom-in").waitFor();
        for (
          let y = 0;
          y < (await page.evaluate(() => document.documentElement.scrollHeight));
          y += 700
        )
          await page.evaluate((y) => scrollTo(0, y), y);
        await page.evaluate(() => scrollTo(0, 0));
        await page.locator("img:visible").evaluateAll(async (imgs) => {
          await Promise.all(imgs.map((i) => i.decode().catch(() => null)));
        });
        const measured = await page.evaluate(() => {
          const visible = (e) =>
            e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
          const blue = [];
          for (const e of document.querySelectorAll(
            "main a,main button,main input,main select,main textarea,main summary,main h1,main h2,main h3",
          )) {
            if (!visible(e) || e.closest(".leaflet-container")) continue;
            for (const prop of ["color", "backgroundColor", "borderColor", "outlineColor"]) {
              const rgb = getComputedStyle(e)[prop].match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (rgb && +rgb[3] > +rgb[1] + 20 && +rgb[3] > +rgb[2] + 10) blue.push(prop);
            }
          }
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            blue,
            brokenImages: [...document.images]
              .filter((i) => visible(i) && !i.naturalWidth && !i.closest(".leaflet-container"))
              .map((i) => i.getAttribute("src")),
            heading: document.querySelector("main h1").textContent,
          };
        });
        const axe = (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze()
        ).violations.map((v) => v.id);
        const file = `${name}-${width}.png`;
        await page.screenshot({ path: path.join(out, file), fullPage: true });
        if (width === 390)
          await page.screenshot({ path: path.join(out, `${name}-390-viewport.png`) });
        records.push({ name, route, width, file, status: response.status(), ...measured, axe });
        console.log(
          `${name}-${width}: overflow=${measured.overflow}, axe=${axe.length}, blue=${measured.blue.length}, photos=${measured.brokenImages.length}`,
        );
      }
    }
    if (!baseline) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("http://127.0.0.1:3000/productos");
      await page.addStyleTag({ content: "html{zoom:2}" });
      await page.screenshot({ path: path.join(out, "catalogo-zoom-css-200.png"), fullPage: true });
      records.push({
        name: "catalogo-zoom-css-200",
        route: "/productos",
        width: 1440,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        note: "Zoom CSS; no equivale al zoom nativo.",
      });
    }
    await context.close();
  } finally {
    await browser.close();
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          baseline,
          records,
          note: "Solo lectura; sin usuarios ni registros temporales. Fotos y cartografía pueden conservar azul.",
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (records.some((r) => r.overflow || r.axe?.length || r.blue?.length || r.brokenImages?.length))
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
