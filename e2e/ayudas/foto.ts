import type { Page } from "@playwright/test";

/** Una foto de 1200 × 800 dibujada en el navegador. Más ancha que 1600 no hace falta. */
export async function fotoDePrueba(page: Page) {
  const base64 = await page.evaluate(() => {
    const lienzo = document.createElement("canvas");
    lienzo.width = 1200;
    lienzo.height = 800;
    const ctx = lienzo.getContext("2d");
    if (!ctx) throw new Error("sin canvas");
    ctx.fillStyle = "#12306E";
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#FDBD73";
    ctx.fillRect(120, 120, 480, 320);
    return lienzo.toDataURL("image/png").split(",")[1] ?? "";
  });
  return {
    name: "foto-de-prueba.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  };
}
