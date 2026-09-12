import { expect, test, type Page } from "@playwright/test";

/**
 * Las piezas de marca de la portada: la ilustracion del horno y los datos que
 * antes estaban escritos a mano.
 *
 * Lo que se defiende aqui no es el aspecto —eso se mira— sino dos formas de
 * envejecer mal:
 *
 *   1. Un numero escrito a mano. "22 años" y "Veintidos años" estaban en el
 *      codigo. No fallan: el 1 de enero siguiente pasan a mentir, en todas las
 *      frases a la vez, sin que nada avise.
 *   2. Un dato repetido en dos sitios que pueden separarse. La hora de apertura
 *      se dice ahora arriba, en el titular, y abajo, en la tabla de horarios.
 *      Si el titular la lleva escrita, el dia que el negocio cambie el turno
 *      desde el panel la pagina se contradira a si misma.
 */

/** El negocio abrio en 2004 (ficha, y migracion 0024). Eso no cambia. */
const ANIO_DE_APERTURA = 2004;

const SIN_ANIMACION = "*,*::before,*::after{animation:none!important;transition:none!important}";

async function abrirPortada(page: Page) {
  await page.goto("/");
  await page.addStyleTag({ content: SIN_ANIMACION });
}

test("la ilustración del horno se carga de verdad", async ({ page }) => {
  await abrirPortada(page);

  const horno = page.locator('img[src*="horno-amanecer"]').first();
  await horno.scrollIntoViewIfNeeded();
  await expect(horno).toBeVisible();

  // Que el `<img>` este en el DOM no prueba nada: `naturalWidth` solo pasa de
  // cero si el navegador decodifico el archivo. A diferencia de las fotos
  // semilla, esta vive en `public/` y por tanto SI esta en el repositorio y en
  // el CI: aqui no hay nada que saltarse, y si falla es que falla.
  await horno.evaluate(async (img: HTMLImageElement) => {
    if (!img.complete) await img.decode();
  });
  expect(await horno.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // Decorativa: lo que dice ya esta escrito al lado. Con un `alt` de verdad, un
  // lector de pantalla leeria dos veces lo mismo.
  await expect(horno).toHaveAttribute("alt", "");
});

test("el titular de la madrugada dice la misma hora que la tabla de horarios", async ({ page }) => {
  await abrirPortada(page);

  const titular = await page.locator("#titulo-madrugada").textContent();
  const enElTitular = titular?.match(/(\d{1,2}:\d{2}\s*[ap]\.\s*m\.)/i)?.[1];
  expect(enElTitular, `El titular no lleva ninguna hora: "${titular}"`).toBeTruthy();

  // La misma hora, leida donde el visitante la comprobaria: el pie, que la saca
  // del horario cargado. Si alguien vuelve a escribir la del titular a mano,
  // esto lo caza en cuanto las dos dejen de coincidir.
  const pie = (await page.getByRole("contentinfo").textContent()) ?? "";
  const normalizar = (h: string) => h.replace(/\s+/g, " ").trim().toLowerCase();
  expect(
    normalizar(pie).includes(normalizar(enElTitular!)),
    `El titular anuncia "${enElTitular}" y el horario del pie no la menciona.`,
  ).toBe(true);
});

test("los años de oficio se calculan, no se escriben", async ({ page }) => {
  await abrirPortada(page);

  // El build prerenderiza la pagina, asi que la cuenta es la del momento del
  // build. Comparar con el reloj de ahora vale igual: lo que se comprueba es
  // que la pagina NO lleve un numero congelado de un anio anterior.
  const esperados = new Date().getFullYear() - ANIO_DE_APERTURA;

  const franja = page.getByRole("region", { name: "Por qué comprar aquí" });
  await expect(franja).toContainText(`Desde ${ANIO_DE_APERTURA}`);
  await expect(
    franja,
    `La franja deberia decir "${esperados} años". Si dice otro numero, esta escrito a mano.`,
  ).toContainText(`${esperados} años`);

  // Y el titular de la historia, que lleva el numero en letra.
  const historia = page.getByRole("heading", { name: /años en el barrio/ });
  await expect(historia).toBeVisible();
});
