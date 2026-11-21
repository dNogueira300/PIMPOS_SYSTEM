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
 * El Día de la Canción Criolla en el sitio público (plan 08.2), con sus dos
 * estilos. Es la alternativa a Halloween para el 31 de octubre: solo una de las
 * dos puede estar encendida, y `apartarLasDemas` aparta también a Halloween.
 *
 * Como las de Navidad y el Día de la Madre, corre en el proyecto `tematicas`
 * (una temática viste el sitio entero) y enciende desde el panel, porque el
 * sitio está en caché y solo el «Guardar» del panel la refresca. Comparte el
 * cerrojo `tematicas`: no puede haber dos temáticas encendidas a la vez.
 *
 * A diferencia del Día de la Madre, los adornos cambian con el estilo, así que
 * se comprueba qué piezas se ven y cómo se mueven en cada uno.
 */

const AVISO = "Feliz Día de la Canción Criolla: pan calientito y buena música";

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
    borde_de_celosia: seccion
      ? getComputedStyle(seccion, "::before").maskImage.includes("celosia")
      : null,
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

/** Abre la Canción Criolla en el panel, aplica `cambiar` y guarda. */
async function guardarCriolla(page: Page, cambiar: () => Promise<void>) {
  await page.goto("/admin/contenido/tematicas/cancion-criolla");
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

test("el Día de la Canción Criolla viste el sitio, con sus dos estilos, y al apagarse vuelve a como estaba", async ({
  page,
  browser,
}) => {
  // Antes del cerrojo: su espera máxima sale del tiempo de la prueba.
  test.setTimeout(300_000);
  await conCerrojo("tematicas", async () => {
    // Lo de fábrica, para dejarlo como estaba (va «Apagada»).
    const [inicio, fin, evento, estilo] = sqlLocal(
      `select concat_ws('|', inicio, fin, coalesce(fecha_evento::text, ''), estilo) from public.tematicas where slug = 'cancion-criolla'`,
    )
      .trim()
      .split("|");
    // Aparta también a Halloween, su alternativa: si no, encenderla chocaría.
    const restaurarLasDemas = apartarLasDemas("cancion-criolla");
    // Dentro del `try`: si falla el alta del usuario, las demás temáticas
    // vuelven igual a sus fechas.
    let usuario: Awaited<ReturnType<typeof entrarComo>> | null = null;
    try {
      usuario = await entrarComo(page, "administrador");
      // Encendida a mano, con la fiesta dentro de 3 días y «Rojo y blanco».
      await guardarCriolla(page, async () => {
        const cuando = page.getByRole("tabpanel", { name: "Cuándo" });
        await cuando.getByLabel("Empieza el").fill(dia(1));
        await cuando.getByLabel("Termina el").fill(dia(6));
        await cuando.getByLabel("Fecha del Día de la Canción Criolla").fill(dia(3));
        await cuando.getByRole("radio", { name: /Encendida ya/ }).check();
        await elegirEstilo(page, /Rojo y blanco/);
      });

      await page.goto("/");
      await expect(
        page.locator('[data-tematica="cancion-criolla"][data-estilo="rojo-blanco"]'),
      ).toHaveCount(1);
      await expect(page.getByRole("complementary", { name: "Campaña de temporada" })).toContainText(
        AVISO,
      );
      await expect(
        page.getByRole("region", { name: "Mensajes del Día de la Canción Criolla" }),
      ).toContainText("Feliz día criollo");
      const seccion = page.locator("[data-seccion-temporada]");
      await expect(seccion.getByRole("heading", { level: 2 })).toContainText(
        "Feliz Día de la Canción Criolla",
      );
      await expect(seccion.locator("[data-cuenta-regresiva]")).toHaveText(
        "Faltan 3 días para el Día de la Canción Criolla",
      );

      // Rojo y blanco: cordel con notas quieto, cajón y guitarra que se mecen,
      // dos pañuelos que se agitan y notas que suben. Nada de Halloween ni de
      // Navidad.
      const rojo = await page.evaluate(leerPiezas);
      expect(rojo.animaciones).toEqual({
        "header::before": "none",
        "header::after": "none",
        "bola 1": "adorno-mece",
        "bola 1::after": "none",
        "bola 2": "panuelo-agita",
        "bola 2::after": "none",
        "bola 4": "panuelo-agita",
        "bola 4::after": "none",
        "bola 5": "adorno-mece",
        "bola 5::after": "none",
        "envoltura::before": "sube-despacio",
        "envoltura::after": "sube-despacio",
      });
      expect(rojo.reciben_clics).toEqual([]);
      expect(rojo.sobre_la_cabecera).toEqual([]);
      expect(rojo.desborde).toBeLessThanOrEqual(0);
      expect(rojo.borde_de_celosia, "el borde de la sección es la celosía").toBe(true);

      // Los pañuelos: repartidos a lo ancho (uno en cada mitad) y siempre a 100 px
      // de una baldosa del cordel, entre dos notas, también en una pantalla ancha.
      for (const ancho of [375, 1280, 1920]) {
        const contexto = await browser.newContext({ viewport: { width: ancho, height: 900 } });
        try {
          const otra = await contexto.newPage();
          await otra.goto("/");
          const [izquierda, derecha, total] = await otra.evaluate(() => {
            const bolas = [...document.querySelectorAll<HTMLElement>(".adornos-tematica__bola")];
            const cordel = document.querySelector<HTMLElement>(".adornos-tematica");
            return [bolas[1].offsetLeft, bolas[3].offsetLeft, cordel?.clientWidth ?? 0];
          });
          expect([izquierda % 160, derecha % 160], `entre notas a ${ancho} px`).toEqual([100, 100]);
          expect(izquierda / total, `pañuelo izquierdo a ${ancho} px`).toBeLessThan(0.5);
          expect(derecha / total, `pañuelo derecho a ${ancho} px`).toBeGreaterThan(0.5);
        } finally {
          await contexto.close();
        }
      }
      await quietoEImpreso(page);

      // axe a 375 px (portada, menú abierto y todas las páginas) y en escritorio.
      await page.goto("/");
      await exigirCeroAxe(page, "la portada a 375 px (rojo y blanco)");
      await page.getByRole("button", { name: "Abrir el menú" }).click();
      await expect(page.getByRole("link", { name: "Nosotros" }).first()).toBeVisible();
      await exigirCeroAxe(page, "el menú del celular (rojo y blanco)");
      await axeEnRutas(page, "a 375 px (rojo y blanco)");
      await enEscritorio(browser, "rojo y blanco");

      // El otro estilo: celosía de madera, cajón, guitarra y buganvillas.
      await guardarCriolla(page, () => elegirEstilo(page, /Balcón limeño/));
      await page.goto("/");
      await expect(
        page.locator('[data-tematica="cancion-criolla"][data-estilo="balcon"]'),
      ).toHaveCount(1);
      const balcon = await page.evaluate(leerPiezas);
      expect(balcon.animaciones).toEqual({
        "header::before": "none",
        "bola 1": "adorno-mece",
        "bola 1::after": "none",
        "bola 5": "adorno-mece",
        "bola 5::after": "none",
        "envoltura::before": "buganvillas-caen",
        "envoltura::after": "buganvillas-caen",
      });
      expect(balcon.reciben_clics).toEqual([]);
      expect(balcon.sobre_la_cabecera).toEqual([]);
      expect(balcon.desborde).toBeLessThanOrEqual(0);
      expect(balcon.borde_de_celosia).toBe(true);
      await quietoEImpreso(page);
      await exigirCeroAxe(page, "la portada a 375 px (balcón limeño)");
      await axeEnRutas(page, "a 375 px (balcón limeño)");
      await enEscritorio(browser, "balcón limeño");

      // Según fechas, con las de la prueba (empiezan mañana): el sitio vuelve a
      // como estaba. Su «Apagada» de fábrica la devuelve el `finally`.
      await guardarCriolla(page, async () => {
        await page
          .getByRole("tabpanel", { name: "Cuándo" })
          .getByRole("radio", { name: /Según fechas/ })
          .check();
        await elegirEstilo(page, /Rojo y blanco/);
      });
      await page.goto("/");
      await expect(page.locator("[data-tematica]")).toHaveCount(0);
      await expect(page.locator("[data-seccion-temporada]")).toHaveCount(0);
      await expect(page.locator(".adornos-tematica")).toHaveCount(0);
    } finally {
      // Vuelve a sus fechas «Apagada», como la deja la migración, antes que
      // las demás: Halloween vuelve después a esas mismas fechas.
      sqlLocal(`
        update public.tematicas
           set encendido = 'apagada', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date, estilo = '${estilo}'
         where slug = 'cancion-criolla';
      `);
      restaurarLasDemas();
      if (usuario) await borrarUsuario(usuario.id);
    }
  });
});
