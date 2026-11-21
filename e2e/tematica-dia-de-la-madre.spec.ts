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
 * El Día de la Madre en el sitio público (plan 08.1), con sus dos estilos.
 *
 * Como la de Navidad, corre en el proyecto `tematicas` (una temática viste el
 * sitio entero) y enciende desde el panel, porque el sitio está en caché y solo
 * el «Guardar» del panel la refresca. Las dos pruebas comparten cerrojo: no
 * puede haber dos temáticas encendidas a la vez.
 */

const AVISO = "Feliz Día de la Madre: gracias por todo, mamá";

/*
 * La función que sigue corre DENTRO del navegador (`page.evaluate`): no puede
 * usar nada de fuera de su cuerpo.
 */

/** Cómo se mueven los banderines y los corazones, y si estorban. */
function leerPiezas() {
  const envoltura = document.querySelector("[data-tematica]");
  const cabecera = document.querySelector<HTMLElement>("[data-tematica] header");
  if (!envoltura || !cabecera) throw new Error("No hay temática puesta");
  const piezas: [string, Element, string][] = [
    ["banderines", cabecera, "::before"],
    ["cordel", cabecera, "::after"],
    ["corazones rosa", envoltura, "::before"],
    ["corazones dorados", envoltura, "::after"],
  ];
  const seccion = document.querySelector(".seccion-temporada");
  return {
    animaciones: Object.fromEntries(
      piezas.map(([nombre, el, seudo]) => [nombre, getComputedStyle(el, seudo).animationName]),
    ),
    reciben_clics: piezas
      .filter(([, el, seudo]) => getComputedStyle(el, seudo).pointerEvents !== "none")
      .map(([nombre]) => nombre),
    // `inset: 100%` se mide sobre el relleno: el borde de arriba de los
    // banderines no puede quedar por encima de donde termina la cabecera.
    sobre_la_cabecera: [cabecera, cabecera]
      .map((el, i) => getComputedStyle(el, i === 0 ? "::before" : "::after").top)
      .some((top) => parseFloat(top) < cabecera.clientHeight - 0.5),
    feston: seccion ? getComputedStyle(seccion, "::before").maskImage.includes("evenodd") : null,
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

/** Abre el Día de la Madre en el panel, aplica `cambiar` y guarda. */
async function guardarMadre(page: Page, cambiar: () => Promise<void>) {
  await page.goto("/admin/contenido/tematicas/dia-de-la-madre");
  await cambiar();
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL("/admin/contenido/tematicas");
}

async function elegirEstilo(page: Page, estilo: RegExp) {
  await page.getByRole("tab", { name: "Estilo" }).click();
  await page.getByRole("tabpanel", { name: "Estilo" }).getByRole("radio", { name: estilo }).check();
}

async function enEscritorio(browser: Browser, estilo: string) {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await contexto.newPage();
    await axeEnRutas(page, `en escritorio (${estilo})`);
    await page.goto("/");
    const piezas = await page.evaluate(leerPiezas);
    expect(piezas.sobre_la_cabecera).toBe(false);
    expect(piezas.desborde).toBeLessThanOrEqual(0);
  } finally {
    await contexto.close();
  }
}

test("el Día de la Madre viste el sitio, con sus dos estilos, y al apagarse vuelve a como estaba", async ({
  page,
  browser,
}) => {
  // Antes del cerrojo: su espera máxima sale del tiempo de la prueba.
  test.setTimeout(300_000);
  await conCerrojo("tematicas", async () => {
    // Lo de fábrica, para dejarlo como estaba.
    const [inicio, fin, evento, estilo] = sqlLocal(
      `select concat_ws('|', inicio, fin, coalesce(fecha_evento::text, ''), estilo) from public.tematicas where slug = 'dia-de-la-madre'`,
    )
      .trim()
      .split("|");
    // Un producto en la sección (sin «solo de temporada»), para que la
    // comprobación de 44 px tenga controles que medir. El «Guardar» del panel
    // lo vuelve a mandar tal cual.
    sqlLocal(`
      insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
      select t.id, p.id, false, 0 from public.tematicas t, public.productos p
       where t.slug = 'dia-de-la-madre' and p.slug = 'frances-chico'
      on conflict do nothing;
    `);
    const restaurarLasDemas = apartarLasDemas("dia-de-la-madre");
    // Dentro del `try`: si falla el alta del usuario, las demás temáticas
    // vuelven igual a sus fechas.
    let usuario: Awaited<ReturnType<typeof entrarComo>> | null = null;
    try {
      usuario = await entrarComo(page, "administrador");
      // Encendida a mano, con la fiesta dentro de 3 días y «Rosa sobre crema».
      await guardarMadre(page, async () => {
        const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
        await cuando.getByLabel("Empieza el").fill(dia(1));
        await cuando.getByLabel("Termina el").fill(dia(6));
        // La etiqueta dice el nombre con su artículo (T2).
        await cuando.getByLabel("Fecha del Día de la Madre").fill(dia(3));
        await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
        await elegirEstilo(page, /Rosa sobre crema/);
      });

      await page.goto("/");
      await expect(
        page.locator('[data-tematica="dia-de-la-madre"][data-estilo="rosa-crema"]'),
      ).toHaveCount(1);
      await expect(page.getByRole("complementary", { name: "Campaña de temporada" })).toContainText(
        AVISO,
      );
      await expect(
        page.getByRole("region", { name: "Mensajes del Día de la Madre" }),
      ).toContainText("Feliz día, mamá");
      const seccion = page.locator("[data-seccion-temporada]");
      await expect(seccion.getByRole("heading", { level: 2 })).toContainText(
        "Feliz Día de la Madre",
      );
      await expect(seccion.locator("[data-cuenta-regresiva]")).toHaveText(
        "Faltan 3 días para el Día de la Madre",
      );

      // Banderines y corazones: se mueven, no se quedan con los clics, no suben
      // sobre la cabecera ni empujan la página. Ningún adorno de Navidad.
      const piezas = await page.evaluate(leerPiezas);
      expect(piezas.animaciones).toEqual({
        banderines: "banderines-mecen",
        cordel: "banderines-mecen",
        "corazones rosa": "sube-despacio",
        "corazones dorados": "sube-despacio",
      });
      expect(piezas.reciben_clics).toEqual([]);
      expect(piezas.sobre_la_cabecera).toBe(false);
      expect(piezas.desborde).toBeLessThanOrEqual(0);
      expect(piezas.feston, "el borde de la sección es el festón, no la nieve").toBe(true);
      await expect(page.locator(".adornos-tematica")).toBeHidden();

      // Con «menos movimiento» no se anima nada; al imprimir no sale ningún adorno.
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await page.evaluate(listarAnimados)).toEqual([]);
      await page.emulateMedia({ reducedMotion: null, media: "print" });
      expect(await page.evaluate(listarAdornosVisibles)).toEqual([]);
      await page.emulateMedia({ media: null });

      // axe a 375 px (portada, menú abierto y todas las páginas) y en escritorio.
      await page.goto("/");
      await exigirCeroAxe(page, "la portada a 375 px (rosa sobre crema)");
      await page.getByRole("button", { name: "Abrir el menú" }).click();
      await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();
      await exigirCeroAxe(page, "el menú del celular (rosa sobre crema)");
      await axeEnRutas(page, "a 375 px (rosa sobre crema)");

      // Área táctil de lo que la temática añade a la portada, a 375 px.
      await page.goto("/");
      const tactil = await page.locator("[data-seccion-temporada]").evaluate((el) => {
        const controles = [...el.querySelectorAll("a, button")]
          .map((c) => ({ texto: c.textContent?.trim() ?? "", caja: c.getBoundingClientRect() }))
          .filter(({ caja }) => caja.width > 0);
        return {
          cuantos: controles.length,
          pequenos: controles
            .filter(({ caja }) => caja.width < 44 || caja.height < 44)
            .map(
              ({ texto, caja }) =>
                `${texto} (${Math.round(caja.width)}×${Math.round(caja.height)})`,
            ),
        };
      });
      // Con el producto de prueba hay controles que medir; si no, no comprobaría nada.
      expect(tactil.cuantos, "la sección de temporada tiene controles").toBeGreaterThan(0);
      expect(tactil.pequenos, "controles de menos de 44 px en la sección de temporada").toEqual([]);
      await enEscritorio(browser, "rosa sobre crema");

      // El otro estilo.
      await guardarMadre(page, () => elegirEstilo(page, /Todo en rosa/));
      await page.goto("/");
      await expect(
        page.locator('[data-tematica="dia-de-la-madre"][data-estilo="rosa"]'),
      ).toHaveCount(1);
      expect((await page.evaluate(leerPiezas)).desborde).toBeLessThanOrEqual(0);
      await exigirCeroAxe(page, "la portada a 375 px (todo en rosa)");
      await axeEnRutas(page, "a 375 px (todo en rosa)");
      await enEscritorio(browser, "todo en rosa");

      // Según fechas, con las de la prueba (empiezan mañana): el sitio vuelve a
      // como estaba. No con las de fábrica: corrida en su semana de mayo, la
      // temática seguiría encendida por fecha sin que nada estuviera roto. Las de
      // fábrica las devuelve el `finally`.
      await guardarMadre(page, async () => {
        await page
          .getByRole("tabpanel", { name: "Cuándo" })
          .getByRole("radio", { name: /Según fechas/ })
          .check();
        await elegirEstilo(page, /Rosa sobre crema/);
      });
      await page.goto("/");
      await expect(page.locator("[data-tematica]")).toHaveCount(0);
      await expect(page.locator("[data-seccion-temporada]")).toHaveCount(0);
      await expect(page.locator(".adornos-tematica")).toHaveCount(0);
    } finally {
      sqlLocal(`
        update public.tematicas
           set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date, estilo = '${estilo}'
         where slug = 'dia-de-la-madre';
      `);
      sqlLocal(`
        delete from public.tematica_productos
         where tematica_id = (select id from public.tematicas where slug = 'dia-de-la-madre')
           and producto_id = (select id from public.productos where slug = 'frances-chico');
      `);
      restaurarLasDemas();
      if (usuario) await borrarUsuario(usuario.id);
    }
  });
});
