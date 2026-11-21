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
 * Halloween en el sitio público (plan 08.2), con sus dos estilos.
 *
 * Como las de Navidad y el Día de la Madre, corre en el proyecto `tematicas`
 * (una temática viste el sitio entero) y enciende desde el panel, porque el
 * sitio está en caché y solo el «Guardar» del panel la refresca. Comparte el
 * cerrojo `tematicas`: no puede haber dos temáticas encendidas a la vez.
 *
 * A diferencia del Día de la Madre, los adornos cambian con el estilo, así que
 * se comprueba qué piezas se ven y cómo se mueven en cada uno.
 */

const AVISO = "Feliz Halloween: dulce o truco en Pimpo's";

/*
 * La función que sigue corre DENTRO del navegador (`page.evaluate`): no puede
 * usar nada de fuera de su cuerpo.
 */

/** Qué adornos se ven, cómo se mueven y si estorban. */
function leerPiezas() {
  const envoltura = document.querySelector("[data-tematica]");
  const cabecera = document.querySelector<HTMLElement>("[data-tematica] header");
  if (!envoltura || !cabecera) throw new Error("No hay temática puesta");
  const bolas = [...cabecera.querySelectorAll(".adornos-tematica__bola")];
  const piezas: [string, Element | null, string | undefined][] = [
    ["header::before", cabecera, "::before"],
    ["header::after", cabecera, "::after"],
    ["luces", cabecera.querySelector(".adornos-tematica__luces"), undefined],
    ...bolas.flatMap((bola, i): [string, Element, string | undefined][] => [
      [`bola ${i + 1}`, bola, undefined],
      [`bola ${i + 1}::before`, bola, "::before"],
      [`bola ${i + 1}::after`, bola, "::after"],
    ]),
    ["envoltura::before", envoltura, "::before"],
    ["envoltura::after", envoltura, "::after"],
  ];
  const visibles = piezas.filter(([, el, seudo]) => {
    if (!el) return false;
    // La envoltura es `display: contents`: no tiene caja, pero sus
    // seudoelementos sí se pintan.
    if (el !== envoltura && !el.checkVisibility()) return false;
    const estilo = getComputedStyle(el, seudo);
    return estilo.display !== "none" && (!seudo || estilo.content !== "none");
  });
  // Donde termina el relleno de la cabecera, como `inset: 100%` (el borde de
  // abajo queda debajo, igual que con los banderines del Día de la Madre).
  const bordeCabecera =
    cabecera.getBoundingClientRect().top + cabecera.clientTop + cabecera.clientHeight;
  const seccion = document.querySelector(".seccion-temporada");
  return {
    animaciones: Object.fromEntries(
      visibles.map(([nombre, el, seudo]) => [
        nombre,
        getComputedStyle(el as Element, seudo).animationName,
      ]),
    ),
    reciben_clics: [
      ...visibles
        .filter(([, el, seudo]) => getComputedStyle(el as Element, seudo).pointerEvents !== "none")
        .map(([nombre]) => nombre),
      ...(seccion &&
      getComputedStyle(seccion, "::before").content !== "none" &&
      getComputedStyle(seccion, "::before").pointerEvents !== "none"
        ? ["el borde de la sección"]
        : []),
    ],
    // `inset: 100%` se mide sobre el relleno: ningún adorno puede empezar por
    // encima de donde termina la cabecera.
    sobre_la_cabecera: [
      ...(["::before", "::after"] as const)
        .filter((seudo) => getComputedStyle(cabecera, seudo).content !== "none")
        .filter(
          (seudo) =>
            parseFloat(getComputedStyle(cabecera, seudo).top) < cabecera.clientHeight - 0.5,
        )
        .map((seudo) => `header${seudo}`),
      ...visibles
        .filter(([nombre, el, seudo]) => nombre.startsWith("bola") && !seudo && el)
        .filter(([, el]) => (el as Element).getBoundingClientRect().top < bordeCabecera - 0.5)
        .map(([nombre]) => nombre),
    ],
    // Los banderines de papel llevan el naranja #e8741c; los rosas del Día de
    // la Madre, no: así se distinguen aunque se muevan igual.
    fondo_banderines: getComputedStyle(cabecera, "::before").backgroundImage,
    borde_de_papel: seccion
      ? getComputedStyle(seccion, "::before").maskImage.includes("papel")
      : null,
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

/** Abre Halloween en el panel, aplica `cambiar` y guarda. */
async function guardarHalloween(page: Page, cambiar: () => Promise<void>) {
  await page.goto("/admin/contenido/tematicas/halloween");
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
    expect(piezas.sobre_la_cabecera).toEqual([]);
    expect(piezas.desborde).toBeLessThanOrEqual(0);
  } finally {
    await contexto.close();
  }
}

/** Con «menos movimiento» nada se anima; al imprimir no sale ningún adorno. */
async function quietoEImpreso(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(listarAnimados)).toEqual([]);
  await page.emulateMedia({ reducedMotion: null, media: "print" });
  expect(await page.evaluate(listarAdornosVisibles)).toEqual([]);
  await page.emulateMedia({ media: null });
}

test("Halloween viste el sitio, con sus dos estilos, y al apagarse vuelve a como estaba", async ({
  page,
  browser,
}) => {
  // Antes del cerrojo: su espera máxima sale del tiempo de la prueba.
  test.setTimeout(300_000);
  await conCerrojo("tematicas", async () => {
    // Lo de fábrica, para dejarlo como estaba.
    const [inicio, fin, evento, estilo] = sqlLocal(
      `select concat_ws('|', inicio, fin, coalesce(fecha_evento::text, ''), estilo) from public.tematicas where slug = 'halloween'`,
    )
      .trim()
      .split("|");
    // Un producto en la sección (sin «solo de temporada»), para que la
    // comprobación de 44 px tenga controles que medir. El «Guardar» del panel
    // lo vuelve a mandar tal cual.
    sqlLocal(`
      insert into public.tematica_productos (tematica_id, producto_id, solo_temporada, orden)
      select t.id, p.id, false, 0 from public.tematicas t, public.productos p
       where t.slug = 'halloween' and p.slug = 'frances-chico'
      on conflict do nothing;
    `);
    const restaurarLasDemas = apartarLasDemas("halloween");
    // Dentro del `try`: si falla el alta del usuario, las demás temáticas
    // vuelven igual a sus fechas.
    let usuario: Awaited<ReturnType<typeof entrarComo>> | null = null;
    try {
      usuario = await entrarComo(page, "administrador");
      // Encendida a mano, con la fiesta dentro de 3 días y «Noche de calabazas».
      await guardarHalloween(page, async () => {
        const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
        await cuando.getByLabel("Empieza el").fill(dia(1));
        await cuando.getByLabel("Termina el").fill(dia(6));
        await cuando.getByLabel("Fecha de Halloween").fill(dia(3));
        await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
        await elegirEstilo(page, /Noche de calabazas/);
      });

      await page.goto("/");
      await expect(
        page.locator('[data-tematica="halloween"][data-estilo="calabaza-noche"]'),
      ).toHaveCount(1);
      await expect(page.getByRole("complementary", { name: "Campaña de temporada" })).toContainText(
        AVISO,
      );
      await expect(page.getByRole("region", { name: "Mensajes de Halloween" })).toContainText(
        "Dulce o truco",
      );
      const seccion = page.locator("[data-seccion-temporada]");
      await expect(seccion.getByRole("heading", { level: 2 })).toContainText("Feliz Halloween");
      await expect(seccion.locator("[data-cuenta-regresiva]")).toHaveText(
        "Faltan 3 días para Halloween",
      );
      // «Halloween» en el naranja que eligió Dan.
      await expect(seccion.locator(".texto-caligrafico")).toHaveCSS("color", "rgb(194, 86, 15)");

      // Noche: telarañas quietas, esqueletito que saluda, calabaza, arañita y
      // murciélagos. Nada más (ni las luces ni las bolas de Navidad, ni nieve).
      const noche = await page.evaluate(leerPiezas);
      expect(noche.animaciones).toEqual({
        "header::before": "none",
        "header::after": "none",
        "bola 1": "adorno-mece",
        "bola 1::before": "halloween-saluda",
        "bola 1::after": "none",
        "bola 2": "adorno-mece",
        "bola 2::after": "none",
        "bola 3": "arana-baja",
        "bola 3::after": "none",
        "envoltura::before": "murcielagos-cruzan",
      });
      expect(noche.reciben_clics).toEqual([]);
      expect(noche.sobre_la_cabecera).toEqual([]);
      expect(noche.desborde).toBeLessThanOrEqual(0);
      expect(noche.borde_de_papel, "el borde de la sección es de papel, no nieve").toBe(true);
      await quietoEImpreso(page);

      // axe a 375 px (portada, menú abierto y todas las páginas) y en escritorio.
      await page.goto("/");
      await exigirCeroAxe(page, "la portada a 375 px (noche de calabazas)");
      await page.getByRole("button", { name: "Abrir el menú" }).click();
      await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();
      await exigirCeroAxe(page, "el menú del celular (noche de calabazas)");
      await axeEnRutas(page, "a 375 px (noche de calabazas)");

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
      await enEscritorio(browser, "noche de calabazas");

      // El otro estilo: banderines de papel, una telaraña y la arañita.
      await guardarHalloween(page, () => elegirEstilo(page, /Calabaza sobre crema/));
      await page.goto("/");
      await expect(
        page.locator('[data-tematica="halloween"][data-estilo="calabaza-crema"]'),
      ).toHaveCount(1);
      await expect(page.locator("[data-seccion-temporada] .texto-caligrafico")).toHaveCSS(
        "color",
        "rgb(194, 86, 15)",
      );
      const crema = await page.evaluate(leerPiezas);
      expect(crema.animaciones).toEqual({
        "header::before": "banderines-mecen",
        "header::after": "banderines-mecen",
        luces: "none",
        "bola 3": "arana-baja",
        "bola 3::after": "none",
      });
      expect(crema.reciben_clics).toEqual([]);
      expect(crema.sobre_la_cabecera).toEqual([]);
      expect(crema.desborde).toBeLessThanOrEqual(0);
      expect(crema.borde_de_papel).toBe(true);
      expect(crema.fondo_banderines, "los banderines son los de papel").toContain("e8741c");
      await quietoEImpreso(page);
      await exigirCeroAxe(page, "la portada a 375 px (calabaza sobre crema)");
      await axeEnRutas(page, "a 375 px (calabaza sobre crema)");
      await enEscritorio(browser, "calabaza sobre crema");

      // Según fechas, con las de la prueba (empiezan mañana): el sitio vuelve a
      // como estaba. Las de fábrica las devuelve el `finally`.
      await guardarHalloween(page, async () => {
        await page
          .getByRole("tabpanel", { name: "Cuándo" })
          .getByRole("radio", { name: /Según fechas/ })
          .check();
        await elegirEstilo(page, /Noche de calabazas/);
      });
      await page.goto("/");
      await expect(page.locator("[data-tematica]")).toHaveCount(0);
      await expect(page.locator("[data-seccion-temporada]")).toHaveCount(0);
      await expect(page.locator(".adornos-tematica")).toHaveCount(0);
    } finally {
      // Halloween vuelve a sus fechas antes que las demás: la Canción Criolla,
      // su alternativa, vuelve apagada a esas mismas fechas.
      sqlLocal(`
        update public.tematicas
           set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date, estilo = '${estilo}'
         where slug = 'halloween';
      `);
      sqlLocal(`
        delete from public.tematica_productos
         where tematica_id = (select id from public.tematicas where slug = 'halloween')
           and producto_id = (select id from public.productos where slug = 'frances-chico');
      `);
      restaurarLasDemas();
      if (usuario) await borrarUsuario(usuario.id);
    }
  });
});
