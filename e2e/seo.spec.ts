import { expect, test } from "@playwright/test";

/**
 * SEO del sitio público (doc 03 §4.4).
 *
 * Nada de esto se ve en la pantalla, y por eso necesita prueba: si el sitemap
 * deja fuera los productos, o el horario sale mal en los datos estructurados, o
 * la imagen para compartir no carga, ninguna persona que mire la página lo
 * notará. Lo nota el buscador, y lo nota quien recibe el enlace por WhatsApp.
 *
 * Solo en escritorio: son archivos y etiquetas, no cambian con el ancho.
 */

test.beforeEach(({ isMobile }) => {
  test.skip(isMobile, "El SEO no depende del ancho de pantalla.");
});

/** Lee y parsea el primer bloque JSON-LD del `@type` pedido. */
async function jsonLd(page: import("@playwright/test").Page, tipo: string) {
  const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
  for (const texto of bloques) {
    const datos = JSON.parse(texto) as { "@type"?: string };
    if (datos["@type"] === tipo) return { datos, texto };
  }
  return null;
}

test("robots.txt deja fuera el panel y apunta al sitemap", async ({ request }) => {
  const respuesta = await request.get("/robots.txt");
  expect(respuesta.status()).toBe(200);

  const texto = await respuesta.text();
  expect(texto).toMatch(/Disallow: \/admin/);
  expect(texto).toMatch(/Disallow: \/ingresar/);
  // URL absoluta: un sitemap relativo no lo sigue ningún buscador.
  expect(texto).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("el sitemap trae las secciones y los productos, y nada del panel", async ({ request }) => {
  const respuesta = await request.get("/sitemap.xml");
  expect(respuesta.status()).toBe(200);

  const xml = await respuesta.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  // Las 8 secciones más la portada, y los 34 productos del catálogo. Sale de la
  // base: si el panel publica un pan, aparece aquí sin tocar código.
  expect(urls.length).toBeGreaterThan(40);
  expect(urls.some((u) => u.endsWith("/productos/frances-chico"))).toBe(true);
  expect(urls.some((u) => u.endsWith("/preguntas-frecuentes"))).toBe(true);

  expect(urls.some((u) => u.includes("/admin") || u.includes("/ingresar"))).toBe(false);
  // Todas absolutas: una relativa invalida el sitemap entero para Google.
  expect(urls.every((u) => /^https?:\/\//.test(u))).toBe(true);
});

test("la portada describe la panaderia con su horario de dos turnos", async ({ page }) => {
  await page.goto("/");

  const encontrado = await jsonLd(page, "Bakery");
  expect(encontrado, "no hay JSON-LD de tipo Bakery en la portada").not.toBeNull();

  const { datos, texto } = encontrado!;
  const panaderia = datos as {
    name: string;
    address: { addressLocality: string };
    geo?: { latitude: number };
    openingHoursSpecification: { dayOfWeek: string[]; opens: string; closes: string }[];
    priceRange?: string;
  };

  expect(panaderia.name).toBe("Panadería Pimpo's");
  expect(panaderia.address.addressLocality).toBe("Iquitos");
  expect(panaderia.geo?.latitude).toBeLessThan(0);

  // Los dos turnos, y el domingo fuera: en schema.org un día que no figura es
  // un día cerrado.
  const horario = panaderia.openingHoursSpecification;
  expect(horario.map((h) => h.opens).sort()).toEqual(["04:00", "16:00"]);
  expect(horario.flatMap((h) => h.dayOfWeek)).not.toContain("https://schema.org/Sunday");

  expect(panaderia.priceRange).toMatch(/^S\/ 0\.10/);

  // El escape que impide que un texto del panel cierre la etiqueta.
  expect(texto).not.toContain("</");
});

test("las preguntas frecuentes van como FAQPage", async ({ page }) => {
  await page.goto("/preguntas-frecuentes");

  const encontrado = await jsonLd(page, "FAQPage");
  expect(encontrado, "no hay JSON-LD de tipo FAQPage").not.toBeNull();

  const { mainEntity } = encontrado!.datos as { mainEntity: { name: string }[] };
  // Las 5 de la ficha, tal cual se ven en la página.
  expect(mainEntity.length).toBe(await page.locator("details").count());
});

test("cada pagina lleva su titulo y descripcion para compartir", async ({ page }) => {
  for (const { ruta, titulo } of [
    { ruta: "/", titulo: "Panadería Pimpo's" },
    { ruta: "/productos", titulo: "Productos" },
    { ruta: "/productos/frances-chico", titulo: "Pan francés chico" },
  ]) {
    await page.goto(ruta);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      new RegExp(titulo),
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      /.{20,}/,
    );
  }
});

test("la imagen para compartir existe y es una imagen de verdad", async ({ page, request }) => {
  await page.goto("/");

  const url = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(url, "la portada no declara og:image").toBeTruthy();
  // Absoluta: WhatsApp y Facebook no resuelven una ruta relativa.
  expect(url).toMatch(/^https?:\/\//);

  // Se pide y se comprueba lo que vuelve, no solo que la etiqueta exista: una
  // etiqueta que apunta a un 500 es un enlace compartido sin foto.
  const respuesta = await request.get(url!);
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()["content-type"]).toContain("image/png");

  const cuerpo = await respuesta.body();
  // Firma PNG y un tamaño que no es una imagen vacía.
  expect(cuerpo.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(cuerpo.byteLength).toBeGreaterThan(10_000);

  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
});
