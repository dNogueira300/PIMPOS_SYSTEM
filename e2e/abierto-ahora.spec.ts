import { expect, test } from "@playwright/test";

/**
 * "Abierto ahora" / "Cerrado ahora" (P2 de la critica del 12/09).
 *
 * El reloj se congela con `page.clock`: sin eso la prueba diria una cosa por la
 * mañana y otra por la tarde, y en el CI —que corre en UTC— otra distinta.
 *
 * Las horas van en UTC con su equivalente de Iquitos al lado (UTC-5). En
 * septiembre de 2026 el 15 es martes y el 20, domingo.
 */

const MARTES_10_DE_LA_MANANA = new Date("2026-09-15T15:00:00Z");
const MARTES_12_59 = new Date("2026-09-15T17:59:00Z");
const DOMINGO_9_DE_LA_MANANA = new Date("2026-09-20T14:00:00Z");

test("en horario de atencion dice que esta abierto y hasta cuando", async ({ page }) => {
  await page.clock.install({ time: MARTES_10_DE_LA_MANANA });
  await page.goto("/contacto");

  const estado = page.locator("main [data-estado]");
  await expect(estado).toHaveAttribute("data-estado", "abierto");
  await expect(estado).toContainText("Abierto ahora");
  await expect(estado).toContainText("Hasta la 1:00 p. m.");
});

test("fuera de horario dice cuando vuelve a abrir", async ({ page }) => {
  await page.clock.install({ time: DOMINGO_9_DE_LA_MANANA });
  await page.goto("/contacto");

  const estado = page.locator("main [data-estado]");
  await expect(estado).toHaveAttribute("data-estado", "cerrado");
  await expect(estado).toContainText("Cerrado ahora");
  // El domingo no abre: lo siguiente es el lunes por la madrugada.
  await expect(estado).toContainText("Abre mañana a las 4:00 a. m.");
});

test("cambia solo al llegar la hora de cierre, sin recargar", async ({ page }) => {
  // Es la razon de que esto sea un componente de cliente y no texto impreso en
  // el build: quien tiene la pagina abierta a las 12:59 no se queda con un
  // "Abierto ahora" que ya no es verdad.
  await page.clock.install({ time: MARTES_12_59 });
  await page.goto("/contacto");

  const estado = page.locator("main [data-estado]");
  await expect(estado).toHaveAttribute("data-estado", "abierto");

  await page.clock.fastForward("02:00");
  await expect(estado).toHaveAttribute("data-estado", "cerrado");
  await expect(estado).toContainText("Abre hoy a las 4:00 p. m.");
});

test("el pie tambien lo dice, en todas las secciones", async ({ page }) => {
  // El horario del pie sale en las ocho secciones; el estado va dentro del
  // mismo componente, asi que no puede faltar en ninguna.
  await page.clock.install({ time: MARTES_10_DE_LA_MANANA });

  for (const ruta of ["/", "/productos", "/galeria"]) {
    await page.goto(ruta);
    const enElPie = page.locator("footer [data-estado]");
    await expect(enElPie, `no hay estado en el pie de ${ruta}`).toHaveAttribute(
      "data-estado",
      "abierto",
    );
  }
});
