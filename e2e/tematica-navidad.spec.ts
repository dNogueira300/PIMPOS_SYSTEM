import { expect, test, type Browser, type Page } from "@playwright/test";

import { sqlLocal } from "./ayudas/base";
import { conCerrojo } from "./ayudas/cerrojo";
import { entrarComo } from "./ayudas/sesion";
import {
  apartarLasDemas,
  axeEnRutas,
  dia,
  exigirCeroAxe,
  listarAdornosVisibles,
  listarAnimados,
} from "./ayudas/tematicas";
import { borrarUsuario } from "./ayudas/usuarios";

/**
 * Navidad en el sitio público (plan 08, T4), con sus dos estilos.
 *
 * Una temática viste el sitio ENTERO, así que estas pruebas no pueden correr a
 * la vez que las del sitio público (varias miran colores): van en el proyecto
 * `tematicas`, que Playwright corre cuando `movil` y `escritorio` terminaron
 * (ver playwright.config.ts). Se enciende desde el panel y no por SQL: el sitio
 * está en caché y solo el «Guardar» del panel la refresca.
 */

async function axeEnEscritorio(browser: Browser, estilo: string) {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await contexto.newPage();
    await axeEnRutas(page, `en escritorio (${estilo})`);
    // Las bolas cuelgan bajo la cabecera también a 1280 px, sin desbordar.
    await page.goto("/");
    const adornos = await page.evaluate(leerAdornos);
    expect(adornos.bolas).toHaveLength(5);
    expect(adornos.sobre_la_cabecera).toEqual([]);
    expect(adornos.desborde).toBeLessThanOrEqual(0);
  } finally {
    await contexto.close();
  }
}

/*
 * La función que sigue corre DENTRO del navegador (`page.evaluate`): no puede
 * usar nada de fuera de su cuerpo.
 */

/** Cómo se mueve cada adorno de Navidad, y si estorba. */
function leerAdornos() {
  const envoltura = document.querySelector("[data-tematica]");
  const cabecera = document.querySelector("[data-tematica] header");
  if (!envoltura || !cabecera) throw new Error("No hay temática puesta");
  const leer = (el: Element, seudo?: string) => {
    const estilo = getComputedStyle(el, seudo);
    return {
      nombre: estilo.animationName,
      duracion: estilo.animationDuration,
      retraso: estilo.animationDelay,
      opacidad: estilo.opacity,
    };
  };
  const luces = [cabecera, ...cabecera.querySelectorAll(".adornos-tematica__luces")];
  const bolas = [...cabecera.querySelectorAll(".adornos-tematica__bola")];
  const adornos = [
    ...cabecera.querySelectorAll(".adornos-tematica, .adornos-tematica *"),
  ] as HTMLElement[];
  // Donde empieza lo que cuelga: `inset: 100%` se mide sobre el relleno, por
  // encima del borde inferior de la cabecera.
  const borde =
    cabecera.getBoundingClientRect().bottom -
    parseFloat(getComputedStyle(cabecera).borderBottomWidth);
  // Los seudoelementos también: una franja a todo el ancho que recibiera clics
  // dejaría sin pulsar lo que pasa por debajo de la cabecera.
  const seudos: [string, Element, string][] = [
    ["luces", cabecera, "::before"],
    ["cable", cabecera, "::after"],
    ["nieve", envoltura, "::before"],
    ["copos", envoltura, "::after"],
  ];
  return {
    luces: luces.map((el, i) => leer(el, i === 0 ? "::before" : undefined)),
    bolas: bolas.map((el) => leer(el)),
    copos: leer(envoltura, "::after"),
    nieve: leer(envoltura, "::before"),
    reciben_clics: [
      ...adornos
        .filter((el) => getComputedStyle(el).pointerEvents !== "none")
        .map((el) => el.className),
      ...seudos
        .filter(([, el, seudo]) => getComputedStyle(el, seudo).pointerEvents !== "none")
        .map(([nombre]) => nombre),
    ],
    sobre_la_cabecera: adornos
      .filter((el) => el.getBoundingClientRect().top < borde - 0.5)
      .map((el) => el.className),
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

/** Abre la temática en el panel, aplica `cambiar` y guarda. */
async function guardarNavidad(page: Page, cambiar: () => Promise<void>) {
  await page.goto("/admin/contenido/tematicas/navidad");
  await cambiar();
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL("/admin/contenido/tematicas");
}

test("Navidad viste el sitio, con sus dos estilos, y al apagarla vuelve a como estaba", async ({
  page,
  browser,
}) => {
  // Antes del cerrojo: su espera máxima sale del tiempo de la prueba.
  // Hasta 10 min: espera su turno en el cerrojo «tematicas», que comparten siete pruebas.
  test.setTimeout(600_000);
  // Las dos pruebas que encienden Navidad escriben la misma fila: una a la vez.
  await conCerrojo("tematicas", async () => {
    const slug = `paneton-e2e-${Date.now()}`;
    const nombre = `Panetón E2E ${slug.slice(-6)}`;
    // Lo de fábrica que se toca, para dejarlo como estaba.
    const antes = sqlLocal(
      `select concat_ws('|', inicio, fin, coalesce(fecha_evento::text, ''), estilo) from public.tematicas where slug = 'navidad'`,
    ).trim();
    const [inicio, fin, evento, estilo] = antes.split("|");
    const aviso = sqlLocal(
      `select texto_aviso from public.tematicas where slug = 'navidad'`,
    ).trim();
    const mensaje = sqlLocal(
      `select mensajes_cinta[1] from public.tematicas where slug = 'navidad'`,
    ).trim();

    sqlLocal(`
      insert into public.productos (categoria_id, nombre, slug, estado)
      select id, '${nombre}', '${slug}', 'publicado' from public.categorias_producto
       where deleted_at is null order by orden limit 1;
      insert into public.producto_variantes (producto_id, nombre, precio, unidad_venta, es_predeterminada)
      select id, 'Unidad', 14, 'unidad', true from public.productos where slug = '${slug}';
      insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
      select t.id, p.id, true, 0 from public.tematicas t, public.productos p
       where t.slug = 'navidad' and p.slug = '${slug}';
    `);
    // Las demás temáticas, lejos: según el día, sus fechas se cruzarían.
    const restaurarLasDemas = apartarLasDemas("navidad");
    // Dentro del `try`: si falla el alta del usuario, las demás temáticas
    // vuelven igual a sus fechas.
    let usuario: Awaited<ReturnType<typeof entrarComo>> | null = null;
    try {
      usuario = await entrarComo(page, "administrador");
      // Encendida a mano, con la fiesta dentro de 12 días.
      await guardarNavidad(page, async () => {
        const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
        await cuando.getByLabel("Empieza el").fill(dia(5));
        await cuando.getByLabel("Termina el").fill(dia(30));
        await cuando.getByLabel("Fecha de Navidad").fill(dia(12));
        await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
        await page.getByRole("tab", { name: "Estilo" }).click();
        await page
          .getByRole("tabpanel", { name: "Estilo" })
          .getByRole("radio", { name: /Noche de Navidad/ })
          .check();
      });

      await page.goto("/");
      await expect(page.locator('[data-tematica="navidad"][data-estilo="noche"]')).toHaveCount(1);
      await expect(page.getByRole("complementary", { name: "Campaña de temporada" })).toContainText(
        aviso,
      );
      await expect(page.getByRole("region", { name: "Mensajes de Navidad" })).toContainText(
        mensaje,
      );
      const seccion = page.locator("[data-seccion-temporada]");
      await expect(seccion.getByRole("heading", { level: 2 })).toContainText("Navidad");
      await expect(seccion.locator("[data-cuenta-regresiva]")).toHaveText(
        "Faltan 12 días para Navidad",
      );
      await expect(seccion.getByText(nombre)).toBeVisible();
      // La sección va antes de «Lo que horneamos hoy».
      const orden = await page.evaluate(() => {
        const temporada = document.querySelector("[data-seccion-temporada]");
        const hoy = document.getElementById("titulo-horneamos");
        return Boolean(
          temporada &&
          hoy &&
          temporada.compareDocumentPosition(hoy) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });
      expect(orden).toBe(true);
      // Los adornos no se quedan con los clics: el enlace de la ficha recibe el
      // puntero (la comprobación de Playwright mira qué elemento hay en ese punto).
      await seccion.getByRole("link", { name: nombre }).click({ trial: true });

      // Los adornos: las luces en dos tandas que se turnan, cinco bolas que se
      // balancean cada una a su aire y copos grandes que caen a otro ritmo que
      // los puntos de nieve.
      const adornos = await page.evaluate(leerAdornos);
      expect(adornos.luces).toHaveLength(2);
      for (const luz of adornos.luces) expect(luz.nombre).toBe("luces-turno");
      expect(adornos.luces[0].retraso).not.toBe(adornos.luces[1].retraso);
      expect(adornos.bolas).toHaveLength(5);
      for (const bola of adornos.bolas) expect(bola.nombre).toBe("bola-balanceo");
      expect(new Set(adornos.bolas.map((b) => b.duracion)).size).toBeGreaterThan(1);
      expect(adornos.copos.nombre).toBe("copos-caen");
      expect(adornos.nieve.nombre).toBe("nieve-cae");
      expect(adornos.copos.duracion).not.toBe(adornos.nieve.duracion);
      // No se quedan con los clics ni tapan nada de la cabecera: cuelgan por
      // debajo de ella, y no empujan la página hacia un lado.
      expect(adornos.reciben_clics).toEqual([]);
      expect(adornos.sobre_la_cabecera).toEqual([]);
      expect(adornos.desborde).toBeLessThanOrEqual(0);

      // La cinta: se desliza, y con «menos movimiento» se queda quieta y la copia
      // del bucle no sale. Al imprimir, la nieve no sale.
      const pista = page.locator(".cinta-tematica__pista");
      await expect(pista).toHaveCSS("animation-name", "cinta-avanza");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(pista).toHaveCSS("animation-name", "none");
      await expect(page.locator(".cinta-tematica ul[aria-hidden]")).toBeHidden();
      // Con «menos movimiento» no se anima nada de la página, ni un seudoelemento.
      expect(await page.evaluate(listarAnimados)).toEqual([]);
      // Y los adornos siguen ahí, quietos y con las luces encendidas.
      const quietos = await page.evaluate(leerAdornos);
      expect(quietos.bolas).toHaveLength(5);
      for (const luz of quietos.luces) expect(luz.opacidad).toBe("1");
      await page.emulateMedia({ reducedMotion: null, media: "print" });
      // Al imprimir no sale ningún adorno.
      expect(await page.evaluate(listarAdornosVisibles)).toEqual([]);
      // Y la letra vuelve a la de la marca: sin fondos impresos, el crema de la
      // noche saldría invisible sobre el papel.
      const letra = await page.evaluate(() => getComputedStyle(document.body).color);
      expect(letra).not.toBe("rgb(247, 241, 227)");
      await page.emulateMedia({ media: null });

      // axe con Navidad, a 375 px, con el menú abierto y en escritorio.
      await page.goto("/");
      await exigirCeroAxe(page, "la portada a 375 px (noche)");
      await page.getByRole("button", { name: "Abrir el menú" }).click();
      await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();
      await exigirCeroAxe(page, "el menú del celular (noche)");
      await page.goto(`/productos/${slug}`);
      await exigirCeroAxe(page, "la ficha del producto de temporada (noche)");
      await axeEnRutas(page, "a 375 px (noche)");

      // Área táctil de lo que la temática añade a la portada, a 375 px.
      await page.goto("/");
      const pequenos = await page.locator("[data-seccion-temporada]").evaluate((seccion) =>
        [...seccion.querySelectorAll("a, button")]
          .map((el) => ({ texto: el.textContent?.trim() ?? "", caja: el.getBoundingClientRect() }))
          .filter(({ caja }) => caja.width > 0 && (caja.width < 44 || caja.height < 44))
          .map(
            ({ texto, caja }) => `${texto} (${Math.round(caja.width)}×${Math.round(caja.height)})`,
          ),
      );
      expect(pequenos, "controles de menos de 44 px en la sección de temporada").toEqual([]);
      await axeEnEscritorio(browser, "noche");

      // El otro estilo.
      await guardarNavidad(page, async () => {
        await page.getByRole("tab", { name: "Estilo" }).click();
        await page
          .getByRole("tabpanel", { name: "Estilo" })
          .getByRole("radio", { name: /Crema navideña/ })
          .check();
      });
      await page.goto("/");
      await expect(page.locator('[data-tematica="navidad"][data-estilo="crema"]')).toHaveCount(1);
      await exigirCeroAxe(page, "la portada a 375 px (crema)");
      const crema = await page.evaluate(leerAdornos);
      expect(crema.bolas).toHaveLength(5);
      expect(crema.sobre_la_cabecera).toEqual([]);
      expect(crema.desborde).toBeLessThanOrEqual(0);
      await axeEnEscritorio(browser, "crema");

      // Según fechas, con la campaña por llegar: el sitio vuelve a como estaba.
      await guardarNavidad(page, async () => {
        await page
          .getByRole("tabpanel", { name: "Cuándo" })
          .getByRole("radio", { name: /Según fechas/ })
          .check();
      });
      await page.goto("/");
      await expect(page.locator("[data-tematica]")).toHaveCount(0);
      await expect(page.locator(".adornos-tematica")).toHaveCount(0);
      await expect(page.locator("[data-seccion-temporada]")).toHaveCount(0);
      await expect(page.locator(".cinta-tematica")).toHaveCount(0);
      await expect(page.getByRole("complementary", { name: "Horario y reparto" })).toBeVisible();
      expect((await page.goto(`/productos/${slug}`))?.status()).toBe(404);
    } finally {
      sqlLocal(`
        delete from public.tematica_productos
         where producto_id in (select id from public.productos where slug = '${slug}');
        delete from public.producto_variantes
         where producto_id in (select id from public.productos where slug = '${slug}');
        delete from public.productos where slug = '${slug}';
        update public.tematicas
           set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date, estilo = '${estilo}'
         where slug = 'navidad';
      `);
      restaurarLasDemas();
      if (usuario) await borrarUsuario(usuario.id);
    }
  });
});
