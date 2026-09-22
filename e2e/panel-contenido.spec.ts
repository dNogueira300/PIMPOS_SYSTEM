import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

const unico = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

test("una pregunta nueva se publica y sale en Preguntas frecuentes", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const pregunta = `¿Prueba E2E ${unico()}?`;
  try {
    await page.goto("/admin/contenido/preguntas/nueva");
    // `exact`: sin él, "Pregunta" también encuentra el interruptor «Publicada
    // · Se ve en Preguntas frecuentes» (contiene "Pregunta" como subcadena).
    await page.getByLabel("Pregunta", { exact: true }).fill(pregunta);
    await page.getByLabel("Respuesta").fill("Sí, esto es una prueba.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    await page.goto("/preguntas-frecuentes");
    await expect(page.getByText(pregunta)).toBeVisible();
  } finally {
    await borrarDeLaBase("faqs", "pregunta", pregunta);
    await borrarUsuario(usuario.id);
  }
});

test("subir una pregunta la adelanta también en el sitio", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const a = `¿Orden A ${unico()}?`;
  const b = `¿Orden B ${unico()}?`;
  try {
    for (const pregunta of [a, b]) {
      await page.goto("/admin/contenido/preguntas/nueva");
      await page.getByLabel("Pregunta", { exact: true }).fill(pregunta);
      await page.getByLabel("Respuesta").fill("Prueba de orden.");
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page).toHaveURL("/admin/contenido/preguntas");
    }

    // Las dos nacen con orden 0 y se desempatan por id, que es aleatorio: se
    // mira cuál quedó debajo y se sube esa.
    const enLista = async () => {
      const textos = await page.getByRole("link", { name: /¿Orden [AB] / }).allTextContents();
      return {
        a: textos.findIndex((t) => t.includes(a)),
        b: textos.findIndex((t) => t.includes(b)),
      };
    };
    const antes = await enLista();
    const deAbajo = antes.a > antes.b ? a : b;
    const deArriba = deAbajo === a ? b : a;

    const subir = page.getByRole("button", { name: `Subir la pregunta ${deAbajo}` }).first();
    await subir.click();
    await expect(page.getByText("Orden cambiado.")).toBeVisible();

    await page.goto("/preguntas-frecuentes");
    const enSitio = await page.getByText(/¿Orden [AB] /).allTextContents();
    expect(enSitio.findIndex((t) => t.includes(deAbajo))).toBeLessThan(
      enSitio.findIndex((t) => t.includes(deArriba)),
    );
  } finally {
    await borrarDeLaBase("faqs", "pregunta", a);
    await borrarDeLaBase("faqs", "pregunta", b);
    await borrarUsuario(usuario.id);
  }
});

test("una foto nueva de galería se sube al bucket galeria y sale en la galería", async ({
  page,
  request,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const alt = `Foto E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/galeria/nueva");
    // Se rellena un campo normal ANTES de tocar el `<input type=file>`: recién
    // navegada la pagina, si la primera interaccion es `setInputFiles` puede
    // llegar antes de que React termine de hidratar y adjuntar su `onChange`
    // — el evento nativo se pierde y la foto no se sube nunca (visto en un
    // vistazo con `page.on("console"/"response")`: sin este relleno previo, no
    // sale ninguna peticion a `/storage/v1/object/galeria/...`).
    await page.getByLabel("Qué se ve en la foto").fill(alt);
    await page.getByLabel("De qué es").selectOption("interior");
    await page.getByLabel("Elegir de la galería").setInputFiles(await fotoDePrueba(page));
    await expect(page.locator("[data-vista-previa]")).toHaveAttribute(
      "src",
      /\/galeria\/panel\/.+\.webp$/,
    );
    const src = await page.locator("[data-vista-previa]").getAttribute("src");
    expect((await request.get(src ?? "")).status()).toBe(200);

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

    await page.goto("/galeria");
    await expect(page.getByRole("img", { name: alt })).toBeVisible();
  } finally {
    await borrarDeLaBase("galeria", "alt", alt);
    await borrarUsuario(usuario.id);
  }
});

test("un slide con enlace pero sin texto de botón se marca en su pestaña", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/contenido/portada/nueva");
    await page.getByLabel("Titular").fill("Slide incompleto");

    // Sin foto, la pestaña «Fotos» también queda con error (imagen_url e
    // imagen_alt son obligatorios) y `PestanasFormulario` salta a la PRIMERA
    // pestaña con error al fallar la validación — no a «Botón y fechas». Se
    // completa la foto para que esa sea la única pestaña incompleta.
    await page.getByRole("tab", { name: "Fotos" }).click();
    await page
      .getByLabel(/Elegir de la galería para Foto grande/)
      .setInputFiles(await fotoDePrueba(page));
    await expect(page.locator("[data-vista-previa]")).toHaveAttribute(
      "src",
      /\/slides\/portada\/.+\.webp$/,
    );
    await page.getByLabel("Qué se ve en la foto").fill("Bandeja de pan de prueba");

    await page.getByRole("tab", { name: "Botón y fechas" }).click();
    await page.getByLabel("A dónde lleva").fill("/productos");
    await page.getByRole("tab", { name: "Texto" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByRole("tab", { name: /Botón y fechas/ })).toHaveAttribute(
      "data-con-error",
      "true",
    );
    await expect(
      page.getByText("Si el slide lleva botón, escribe el texto y el enlace."),
    ).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un testimonio nuevo se guarda sin publicar y no sale en la portada", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const nombre = `Cliente E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/testimonios/nueva");
    await page.getByLabel("Nombre de quien lo dice").fill(nombre);
    await page.getByLabel("Lo que dijo").fill("El pan de las cuatro es el mejor.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Guardado como borrador")).toBeVisible();

    await page.goto("/");
    await expect(page.getByText(nombre)).toHaveCount(0);
  } finally {
    await borrarDeLaBase("testimonios", "nombre", nombre);
    await borrarUsuario(usuario.id);
  }
});

test("una guía nueva queda en la lista con su estado", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  const titulo = `Guía E2E ${unico()}`;
  try {
    await page.goto("/admin/contenido/guias/nueva");
    await page.getByLabel("Título").fill(titulo);
    await page.getByLabel("Pasos").fill("Escríbenos.\nTe respondemos.");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL("/admin/contenido/guias");
    await expect(page.getByRole("link", { name: titulo }).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("guias", "titulo", titulo);
    await borrarUsuario(usuario.id);
  }
});
