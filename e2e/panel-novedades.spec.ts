import { expect, test, type Browser } from "@playwright/test";

import { borrarDeLaBase } from "./ayudas/base";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, CLAVE_DE_PRUEBA } from "./ayudas/usuarios";

/**
 * Dos personas a la vez necesitan dos contextos. Un contexto creado a mano NO
 * hereda el `use` de playwright.config.ts: sin copiarle la dirección base, el
 * idioma y el tamaño, `goto("/admin")` no sabe a dónde ir.
 */
async function paginaNueva(browser: Browser) {
  const { baseURL, viewport, isMobile, hasTouch } = test.info().project.use;
  const contexto = await browser.newContext({
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    locale: "es-PE",
    timezoneId: "America/Lima",
  });
  return { contexto, page: await contexto.newPage() };
}

test("ingeniero envía, administrador devuelve, ingeniero corrige, administrador publica", async ({
  browser,
}) => {
  const titulo = `Promo E2E ${Date.now()}`;
  const inge = await paginaNueva(browser);
  const admin = await paginaNueva(browser);
  const ingeniero = await entrarComo(inge.page, "ingeniero");
  const administrador = await entrarComo(admin.page, "administrador");

  try {
    // 1. El ingeniero no tiene «Publicar»: envía a revisión.
    await inge.page.goto("/admin/contenido/novedades/nueva");
    await inge.page.getByLabel("Tipo").selectOption("promocion");
    await inge.page.getByLabel("Título").fill(titulo);
    await inge.page.getByLabel("Texto").fill("Dos por uno en pan de yema.");
    await expect(inge.page.getByRole("button", { name: "Publicar" })).toHaveCount(0);
    await inge.page.getByRole("button", { name: "Enviar a revisión" }).click();
    await expect(inge.page.getByText("Enviada a revisión")).toBeVisible();

    // 2. El administrador lo ve en su inicio y la devuelve.
    //
    // El aviso cuenta TODAS las promociones en revisión, no solo la de esta
    // prueba: los proyectos `movil` y `escritorio` corren esta misma prueba en
    // paralelo contra la misma base, así que el número puede ser 1 o 2 y el
    // texto pasa de "espera" a "esperan" (el total nunca es suyo, CLAUDE.md).
    // Se comprueba el sufijo común, no el número.
    await admin.page.goto("/admin");
    await expect(admin.page.locator('[data-aviso="promociones-en-revision"]')).toContainText(
      "tu aprobación",
    );
    await admin.page.goto("/admin/contenido/novedades");
    await admin.page.getByRole("link", { name: titulo }).first().click();
    await admin.page.getByRole("button", { name: "Devolver con comentario" }).click();
    await expect(
      admin.page.getByText("Escribe qué hay que corregir antes de devolverla."),
    ).toBeVisible();
    await admin.page
      .getByLabel("Si la devuelves, ¿qué hay que corregir?")
      .fill("Falta la fecha de fin.");
    await admin.page.getByRole("button", { name: "Devolver con comentario" }).click();
    await expect(admin.page.getByText("Devuelta con tu comentario.")).toBeVisible();

    // 3. El ingeniero lee el comentario y la reenvía.
    await inge.page.goto("/admin");
    await expect(inge.page.locator('[data-aviso="promociones-devueltas"]')).toBeVisible();
    await inge.page.goto("/admin/contenido/novedades");
    await inge.page.getByRole("link", { name: titulo }).first().click();
    await expect(inge.page.locator("[data-comentario-revision]")).toContainText(
      "Falta la fecha de fin.",
    );
    await inge.page.getByRole("tab", { name: "Vigencia" }).click();
    await inge.page.getByLabel("Se ve hasta").fill("2099-12-31T20:00");
    await inge.page.getByRole("button", { name: "Enviar a revisión" }).click();
    await expect(inge.page.getByText("Enviada a revisión")).toBeVisible();

    // Mientras espera, el ingeniero no puede tocarla.
    await inge.page.getByRole("link", { name: titulo }).first().click();
    await expect(inge.page.locator("[data-esperando-aprobacion]")).toBeVisible();

    // 4. El administrador la publica y el sitio la muestra.
    await admin.page.goto("/admin/contenido/novedades");
    await admin.page.getByRole("link", { name: titulo }).first().click();
    await admin.page.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.page.getByText("Publicada. Ya se ve en el sitio.")).toBeVisible();
    await admin.page.goto("/novedades");
    await expect(admin.page.getByText(titulo).first()).toBeVisible();
  } finally {
    await borrarDeLaBase("novedades", "titulo", titulo);
    await borrarUsuario(ingeniero.id);
    await borrarUsuario(administrador.id);
    await inge.contexto.close();
    await admin.contexto.close();
  }
});

test("aunque la pida por la API, un ingeniero no puede publicar una promoción", async ({
  page,
}) => {
  const titulo = `Promo API ${Date.now()}`;
  const ingeniero = await entrarComo(page, "ingeniero");
  const { apiUrl, anonKey } = supabaseLocal();
  try {
    const sesion = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: ingeniero.correo, password: CLAVE_DE_PRUEBA }),
    });
    const { access_token } = (await sesion.json()) as { access_token: string };

    const intento = await fetch(`${apiUrl}/rest/v1/novedades`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo: "promocion",
        titulo,
        slug: `promo-api-${Date.now()}`,
        contenido: "Me publico sola.",
        estado: "publicado",
      }),
    });
    const cuerpo = await intento.text();
    expect(intento.status, cuerpo).toBe(400);
    expect(cuerpo).toContain("Las promociones requieren aprobacion de un administrador");
  } finally {
    await borrarDeLaBase("novedades", "titulo", titulo);
    await borrarUsuario(ingeniero.id);
  }
});
