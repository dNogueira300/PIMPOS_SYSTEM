import { expect, test } from "@playwright/test";

// Las ocho secciones del sitio publico (doc 03 §4.1). Lo que se comprueba aqui
// no es el diseno sino que cada pagina responde, tiene un solo encabezado y
// muestra contenido que viene de la base.

const SECCIONES = [
  { ruta: "/productos", titulo: "Nuestros productos" },
  { ruta: "/novedades", titulo: "Novedades" },
  { ruta: "/nosotros", titulo: "Nuestra historia" },
  { ruta: "/galeria", titulo: "Así es la panadería" },
  { ruta: "/ubicacion", titulo: "Dónde estamos" },
  { ruta: "/preguntas-frecuentes", titulo: "Preguntas frecuentes" },
  { ruta: "/contacto", titulo: "Hablemos" },
] as const;

for (const { ruta, titulo } of SECCIONES) {
  test(`${ruta} responde y tiene un unico encabezado`, async ({ page }) => {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(200);

    // Un h1 por pagina, ni cero ni dos: es lo que le dice a un lector de
    // pantalla y a un buscador de que trata esta pagina.
    const encabezado = page.getByRole("heading", { level: 1 });
    await expect(encabezado).toHaveCount(1);
    await expect(encabezado).toContainText(titulo);
  });
}

test("el catalogo filtra por categoria y el filtro vive en la URL", async ({ page }) => {
  await page.goto("/productos");

  const total = await page.locator("article").count();
  expect(total).toBeGreaterThan(10);

  await page.getByRole("link", { name: "Panes clásicos", exact: true }).click();

  // El estado va en la URL a proposito: asi el cliente puede mandar el enlace
  // de "los integrales" por WhatsApp y el buscador puede indexar la categoria.
  await expect(page).toHaveURL(/categoria=panes-clasicos/);

  const filtrados = await page.locator("article").count();
  expect(filtrados).toBeGreaterThan(0);
  expect(filtrados).toBeLessThan(total);
});

test("el detalle de producto muestra precio y pedido", async ({ page }) => {
  await page.goto("/productos/frances-chico");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pan francés chico");
  // El pan mas barato del catalogo. Si esto cambia de valor es una decision del
  // negocio; si desaparece, es un fallo.
  await expect(page.getByText("S/ 0.10").first()).toBeVisible();
  // Dentro del contenido, no en cualquier sitio: el de la cabecera esta oculto
  // por debajo de `sm`, y en movil seria el primero del DOM.
  await expect(page.getByRole("main").locator('a[href^="https://wa.me/"]').first()).toBeVisible();
});

test("un producto que no existe da 404, no una pagina vacia", async ({ page }) => {
  const respuesta = await page.goto("/productos/pan-que-no-existe");
  expect(respuesta?.status()).toBe(404);
});

test("la galeria muestra las fotos reales del local", async ({ page }) => {
  await page.goto("/galeria");

  const fotos = page.locator("figure img");
  expect(await fotos.count()).toBeGreaterThan(5);

  // Toda foto lleva texto alternativo: son fotos con informacion (la fachada,
  // el horno), no decoracion.
  for (const foto of await fotos.all()) {
    expect(await foto.getAttribute("alt")).toBeTruthy();
  }
});

test("las preguntas frecuentes se abren y se cierran", async ({ page }) => {
  await page.goto("/preguntas-frecuentes");

  const primera = page.locator("details").first();
  await expect(primera).not.toHaveAttribute("open", "");

  await primera.locator("summary").click();
  await expect(primera).toHaveAttribute("open", "");
});

test("la ubicacion carga el mapa en diferido", async ({ page }) => {
  await page.goto("/ubicacion");

  // Leaflet no entra en el paquete inicial (doc 03 §4.5); aparece despues. Lo
  // que se comprueba es que llega a aparecer, no cuando.
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".leaflet-tile").first()).toBeVisible();
});

test("nosotros trae la historia, la mision y los valores de la ficha", async ({ page }) => {
  await page.goto("/nosotros");

  await expect(page.getByRole("heading", { name: "Misión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Visión" })).toBeVisible();
  // Los cuatro valores salen de `configuracion_sitio`, no del codigo.
  for (const valor of ["Calidad", "Puntualidad", "Compromiso", "Calidez"]) {
    await expect(page.getByText(valor, { exact: true })).toBeVisible();
  }
});

test("el pie repite contacto y horario en todas las secciones", async ({ page }) => {
  await page.goto("/contacto");

  const pie = page.getByRole("contentinfo");
  await expect(pie.getByText("Calle Elías Aguirre 1321")).toBeVisible();
  await expect(pie.getByText("Cerrado")).toBeVisible();
});
