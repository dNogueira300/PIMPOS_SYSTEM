import { expect, test } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { conCerrojo } from "./ayudas/cerrojo";
import { fotoDePrueba } from "./ayudas/foto";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
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
    // En el mismo cerrojo que la prueba de orden: las dos invalidan y vuelven
    // a pintar /preguntas-frecuentes, y un render que una empieza mientras la
    // otra invalida puede dejar en caché la versión de antes (ver abajo).
    await conCerrojo("faqs-orden", async () => {
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page.getByText("Guardado. Ya se ve en el sitio.")).toBeVisible();

      await page.goto("/preguntas-frecuentes");
      await expect(page.getByText(pregunta)).toBeVisible();
    });
  } finally {
    await borrarDeLaBase("faqs", "pregunta", pregunta);
    await borrarUsuario(usuario.id);
  }
});

/**
 * Dos preguntas publicadas, puestas directamente en la base al FINAL de la
 * lista y seguidas (orden máximo + 1 y + 2): así la de abajo tiene a la otra
 * justo encima y «Subir» las intercambia a ellas, no a una pregunta ajena.
 */
async function crearPreguntasAlFinal(arriba: string, abajo: string): Promise<void> {
  const { apiUrl, serviceRoleKey } = supabaseLocal();
  const cabeceras = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
  const ultima = await fetch(`${apiUrl}/rest/v1/faqs?select=orden&order=orden.desc&limit=1`, {
    headers: cabeceras,
  });
  const [fila] = (await ultima.json()) as { orden: number }[];
  const base = (fila?.orden ?? 0) + 1;
  const respuesta = await fetch(`${apiUrl}/rest/v1/faqs`, {
    method: "POST",
    headers: { ...cabeceras, Prefer: "return=minimal" },
    body: JSON.stringify([
      { pregunta: arriba, respuesta: "Prueba de orden.", estado: "publicado", orden: base },
      { pregunta: abajo, respuesta: "Prueba de orden.", estado: "publicado", orden: base + 1 },
    ]),
  });
  if (!respuesta.ok) {
    throw new Error(
      `No se pudieron crear las preguntas: ${respuesta.status} ${await respuesta.text()}`,
    );
  }
}

/**
 * Cada ejecución trae sus propias preguntas, con el nombre del proyecto y un
 * sufijo al azar, y mira solo el orden relativo de ESAS dos.
 *
 * Aun así, crearlas y moverlas va dentro de un cerrojo entre procesos: cuando
 * la tabla no tiene los `orden` seguidos (0, 1, 2…), `moverFila` los reescribe
 * TODOS con su posición (`reordenar()`, T5), así que dos movimientos a la vez
 * sobre `faqs` —de dos proyectos o dos repeticiones— se pisan aunque cada uno
 * mueva filas distintas, y dos altas «al final» a la vez tomarían el mismo
 * orden. No hay forma de aislarlo solo con datos propios; el cerrojo deja
 * correr los dos proyectos en paralelo y pone en fila solo este tramo.
 */
test("subir una pregunta la adelanta también en el sitio", async ({ page }, info) => {
  const usuario = await entrarComo(page, "administrador");
  const sufijo = `${info.project.name} ${unico()}`;
  const arriba = `¿Orden A ${sufijo}?`;
  const abajo = `¿Orden B ${sufijo}?`;
  const nuestras = new RegExp(`¿Orden [AB] ${sufijo}`);
  try {
    await conCerrojo("faqs-orden", async () => {
      await crearPreguntasAlFinal(arriba, abajo);

      await page.goto("/admin/contenido/preguntas");
      // La lista llega en streaming (<Suspense>): se espera a las dos.
      await page.getByRole("link", { name: arriba }).first().waitFor();
      await page.getByRole("link", { name: abajo }).first().waitFor();
      const enLista = await page.getByRole("link", { name: nuestras }).allTextContents();
      expect(
        enLista.findIndex((t) => t.includes(arriba)),
        "antes, A va encima de B",
      ).toBeLessThan(enLista.findIndex((t) => t.includes(abajo)));

      await page
        .getByRole("button", { name: `Subir la pregunta ${abajo}` })
        .first()
        .click();
      await expect(page.getByText("Orden cambiado.")).toBeVisible();

      // La base, primero: es la verdad, y no depende de ninguna caché.
      const { apiUrl, serviceRoleKey } = supabaseLocal();
      const filas = (await (
        await fetch(
          `${apiUrl}/rest/v1/faqs?select=pregunta,orden&pregunta=in.(${[arriba, abajo]
            .map((p) => `"${encodeURIComponent(p)}"`)
            .join(",")})`,
          { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
        )
      ).json()) as { pregunta: string; orden: number }[];
      const orden = (p: string) => filas.find((f) => f.pregunta === p)?.orden ?? NaN;
      expect(orden(abajo), "en la base, la subida tiene ahora un orden menor").toBeLessThan(
        orden(arriba),
      );

      // El sitio. Visto en la ronda 3: con otra prueba pintando la misma
      // página a la vez, un render empezado ANTES del `updateTag` de esta
      // acción puede guardar en caché la versión previa DESPUÉS de la
      // invalidación, y ahí se queda hasta el siguiente cambio. Por eso la
      // prueba de alta de preguntas comparte el cerrojo. La recarga cubre el
      // desfase corto entre invalidar y volver a pintar.
      await expect(async () => {
        await page.goto("/preguntas-frecuentes");
        await page.getByText(abajo).first().waitFor();
        const enSitio = await page.getByText(nuestras).allTextContents();
        const posSubida = enSitio.findIndex((t) => t.includes(abajo));
        const posOtra = enSitio.findIndex((t) => t.includes(arriba));
        expect(posOtra, "la otra también sale en el sitio").toBeGreaterThanOrEqual(0);
        expect(posSubida, "la que se subió va ahora antes que la otra").toBeLessThan(posOtra);
      }).toPass({ timeout: 15_000 });
    });
  } finally {
    await borrarDeLaBase("faqs", "pregunta", arriba);
    await borrarDeLaBase("faqs", "pregunta", abajo);
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
