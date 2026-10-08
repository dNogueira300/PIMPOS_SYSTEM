/* eslint-disable @typescript-eslint/no-require-imports -- Guion de captura local ejecutado como CommonJS por Node. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve("DOC/Maquetas/comparacion-redisenio");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4177", { waitUntil: "networkidle" });
    const screens = await page
      .locator("#screen option")
      .evaluateAll((es) => es.map((e) => e.value));
    let combinations = 0,
      decodedImages = 0;
    for (const screen of screens)
      for (const width of ["1440", "390"])
        for (const mode of [
          "a",
          "actual,a",
          "a-inicial,a",
          ...(["publico", "catalogo"].includes(screen) ? ["a-liso,a"] : []),
        ]) {
          await page.locator("#screen").selectOption(screen);
          await page.locator("#width").selectOption(width);
          await page.locator("#mode").selectOption(mode);
          await page.evaluate(async () => {
            await Promise.all(
              ["left-image", "right-image"]
                .filter((id) => !document.getElementById(id).closest("figure").hidden)
                .map((id) => document.getElementById(id).decode()),
            );
          });
          combinations++;
          decodedImages += mode.split(",").length;
        }
    await page.locator("#screen").selectOption("login");
    await page.locator("#width").selectOption("1440");
    await page.locator("#mode").selectOption("a");
    await page.evaluate(async () => {
      await Promise.all(
        ["left-image", "right-image"].map((id) => document.getElementById(id).decode()),
      );
    });
    await page.screenshot({ path: path.join(out, "galeria-escritorio.png") });
    await page.locator("#screen").selectOption("historial");
    await page.locator("#mode").selectOption("actual,a");
    await page.locator("#width").selectOption("390");
    await page.evaluate(async () => {
      await Promise.all(
        ["left-image", "right-image"].map((id) => document.getElementById(id).decode()),
      );
      document.getElementById("left-viewport").scrollTop = 300;
    });
    await page.waitForFunction(() => document.getElementById("right-viewport").scrollTop > 0);
    await page.locator("#sync").click();
    if ((await page.locator("#sync").getAttribute("aria-pressed")) !== "false")
      throw Error("Sync toggle");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#screen").selectOption("login");
    await page.locator("#mode").selectOption("a");
    await page.screenshot({ path: path.join(out, "galeria-movil.png"), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow || errors.length) throw Error(JSON.stringify({ overflow, errors }));
    const report = {
      combinations,
      decodedImages,
      javascriptErrors: errors.length,
      galleryMobileOverflow: overflow,
      synchronizedScroll: true,
      toggleVerified: true,
    };
    fs.writeFileSync(path.join(out, "verificacion-galeria.json"), JSON.stringify(report, null, 2));
    console.log(report);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
