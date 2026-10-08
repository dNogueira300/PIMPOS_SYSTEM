/* eslint-disable @typescript-eslint/no-require-imports -- Guion de captura local ejecutado como CommonJS por Node. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve("DOC/Maquetas/rediseno-2026-10-06");
const targets = [
  ["chola", "https://elpandelachola.com/"],
  ["atelier", "https://www.panatelier.com.pe/"],
  ["kalatanta", "https://kalatanta.pe/"],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const result = [];
  try {
    for (const [name, url] of targets) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      });
      const item = { name, url };
      try {
        const res = await page.goto(url, { waitUntil: "commit", timeout: 45000 });
        item.status = res?.status();
        await page.waitForLoadState("domcontentloaded", { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(2500);
        for (
          let y = 0;
          y < Math.min(await page.evaluate(() => document.body.scrollHeight), 16000);
          y += 800
        ) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(180);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(out, `${name}-viewport.png`), timeout: 15000 });
        await page.screenshot({
          path: path.join(out, `${name}-desktop.png`),
          fullPage: true,
          timeout: 15000,
        });
        item.desktop = await page.evaluate(() => ({
          title: document.title,
          text: document.body.innerText.slice(0, 16000),
          typography: [...document.querySelectorAll("h1,h2,h3,header a,nav a")]
            .slice(0, 30)
            .map((e) => ({
              text: e.textContent.trim().slice(0, 100),
              font: getComputedStyle(e).fontFamily,
              size: getComputedStyle(e).fontSize,
              color: getComputedStyle(e).color,
            })),
          backgrounds: [...document.querySelectorAll("body,header,section,footer")]
            .slice(0, 30)
            .map((e) => ({ tag: e.tagName, background: getComputedStyle(e).backgroundColor })),
          images: [...document.images]
            .slice(0, 35)
            .map((e) => ({ alt: e.alt, loaded: e.complete && e.naturalWidth > 0 })),
        }));
        await page.setViewportSize({ width: 375, height: 812 });
        await page.reload({ waitUntil: "commit", timeout: 45000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
        for (
          let y = 0;
          y < Math.min(await page.evaluate(() => document.body.scrollHeight), 16000);
          y += 650
        ) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(150);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(out, `${name}-mobile.png`),
          fullPage: true,
          timeout: 15000,
        });
        item.mobile = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
      } catch (error) {
        item.error = String(error);
      }
      result.push(item);
      fs.writeFileSync(path.join(out, "referencias.json"), JSON.stringify(result, null, 2));
      console.log(
        JSON.stringify({ name, status: item.status, error: item.error, mobile: item.mobile }),
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
