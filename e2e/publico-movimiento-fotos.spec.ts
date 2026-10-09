import { expect, test } from "@playwright/test";

test("la moto cruza al aparecer, termina en cuatro segundos y no repite", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const pista = page.locator("[data-recorrido-delivery]");
  await expect(pista).toBeAttached();
  const moto = pista.locator("[data-moto-delivery]");
  expect(await moto.evaluate((el) => el.getAnimations().length)).toBe(0);
  await pista.scrollIntoViewIfNeeded();
  await expect.poll(() => moto.evaluate((el) => el.getAnimations().length)).toBe(1);
  const tiempo = await moto.evaluate((el) => el.getAnimations()[0].effect!.getTiming());
  expect(tiempo.duration).toBe(4000);
  expect(tiempo.iterations).toBe(1);
  const comienzo = (await moto.boundingBox())!.x;
  await expect.poll(async () => (await moto.boundingBox())!.x).toBeGreaterThan(comienzo + 8);
  await moto.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animacion) => animacion.finished));
  });
  const final = (await moto.boundingBox())!.x;
  const limites = (await pista.boundingBox())!;
  const dibujo = (await moto.locator("svg").boundingBox())!;
  expect(Math.abs(dibujo.x + dibujo.width - limites.x - limites.width)).toBeLessThan(2);
  await page.evaluate(() => scrollTo(0, 0));
  await pista.scrollIntoViewIfNeeded();
  expect((await moto.boundingBox())!.x).toBeCloseTo(final, 0);
  expect(await moto.evaluate((el) => el.getAnimations()[0].playState)).toBe("finished");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("con movimiento reducido la moto permanece estática y el pedido sigue visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const pista = page.locator("[data-recorrido-delivery]");
  await expect(pista).toBeAttached();
  await pista.scrollIntoViewIfNeeded();
  expect(
    await pista.locator("[data-moto-delivery]").evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await expect(page.locator("#titulo-delivery")).toBeVisible();
  await expect(pista.locator("svg")).toBeVisible();
});

test("las fotografías aumentan solo un tres por ciento al pasar el cursor", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "El hover se reserva para cursor preciso.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [ruta, selector] of [
    ["/galeria", "main figure img"],
    ["/nosotros", "main img"],
    ["/productos/frances-chico", "main img"],
    ["/", "section[aria-labelledby='titulo-historia'] img"],
  ]) {
    await page.goto(ruta);
    const foto = page.locator(selector).first();
    await foto.scrollIntoViewIfNeeded();
    await foto.hover();
    await expect
      .poll(() => foto.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
      .toBeCloseTo(1.03, 2);
    await page.mouse.move(0, 0);
    await expect
      .poll(() => foto.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
      .toBeCloseTo(1, 2);
  }
});

test("las fotografías no hacen zoom con movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/galeria");
  const foto = page.locator("main figure img").first();
  await foto.hover();
  await expect(foto).toHaveCSS("transform", "none");
});

test("el hover no activa zoom en pantalla táctil", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Comprobación de pantalla táctil.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/galeria");
  const foto = page.locator("main figure img").first();
  await foto.hover();
  await expect(foto).toHaveCSS("transform", "none");
});
