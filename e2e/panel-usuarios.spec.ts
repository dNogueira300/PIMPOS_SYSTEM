import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario, borrarUsuarioPorCorreo, crearUsuario } from "./ayudas/usuarios";

/** Dos proyectos corren a la vez: cada prueba usa nombres y correos suyos. */
const sufijo = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Entra en un navegador aparte, sin la sesión de quien administra. */
async function intentarEntrar(browser: Browser, correo: string, clave: string): Promise<Page> {
  const { baseURL } = test.info().project.use;
  const contexto = await browser.newContext({ baseURL });
  const pagina = await contexto.newPage();
  await pagina.goto("/ingresar");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel("Contraseña").fill(clave);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  return pagina;
}

/**
 * Reescribe en el camino la petición de la Server Action que sale de la ficha
 * de `desde` para que apunte a `hacia`. Es lo que haría alguien copiando la
 * petición desde las herramientas del navegador: esconder un botón no es
 * control de acceso. Devuelve si la reescritura llegó a ocurrir.
 */
async function apuntarLaAccionA(page: Page, desde: string, hacia: string) {
  const estado = { reescrita: false };
  await page.route(`**/admin/usuarios/${desde}`, async (ruta) => {
    const peticion = ruta.request();
    const cuerpo = peticion.postData();
    if (peticion.method() !== "POST" || !peticion.headers()["next-action"] || !cuerpo) {
      return ruta.continue();
    }
    expect(cuerpo).toContain(desde);
    estado.reescrita = true;
    await ruta.continue({ postData: cuerpo.replaceAll(desde, hacia) });
  });
  return estado;
}

test("un administrador da de alta a alguien, y ese alguien cambia la contraseña al entrar", async ({
  page,
}) => {
  const admin = await entrarComo(page, "administrador");
  const id = sufijo();
  const correo = `e2e-alta-${id}@pimpos.test`;
  const nombre = `Debra ${id}`;
  try {
    await page.goto("/admin/usuarios/nuevo");
    await expect(page.getByRole("radio", { name: /Ingeniero/ })).toBeVisible();
    // Un administrador no puede ni ver la opción de crear un superadmin.
    await expect(page.getByRole("radio", { name: /Super administrador/ })).toHaveCount(0);

    await page.getByLabel("Nombre y apellido").fill(nombre);
    await page.getByLabel("Correo").fill(correo);
    await page.getByRole("radio", { name: /Ingeniero/ }).check();
    await page.getByRole("button", { name: "Guardar" }).click();

    const clave = (await page.locator("[data-clave]").textContent())?.trim() ?? "";
    expect(clave).toMatch(/^[A-HJ-NP-Za-km-z2-9]{12}$/);
    // La temporal tampoco queda en la copia local del formulario.
    const copia = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    expect(copia).not.toContain(clave);

    await page.getByRole("link", { name: "Listo, ya la anoté" }).click();
    await expect(page.getByRole("link", { name: new RegExp(nombre) })).toBeVisible();

    // Sale el administrador y entra la persona nueva.
    await page.context().clearCookies();
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill(clave);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/cambiar-clave");
    await page.getByLabel("Contraseña nueva").waitFor();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // No puede saltárselo escribiendo la dirección.
    await page.goto("/admin/contenido");
    await expect(page).toHaveURL("/cambiar-clave");

    await page.getByLabel("Contraseña nueva").fill("MiClaveDePrueba2026");
    await page.getByLabel("Repítela").fill("MiClaveDePrueba2026");
    // La copia local se escribe a los 800 ms de teclear: se espera a que
    // haya pasado para que la comprobación no gane por llegar antes.
    await page.waitForTimeout(1200);
    const guardado = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    expect(guardado).not.toContain("MiClaveDePrueba2026");

    await page.getByRole("button", { name: "Guardar y entrar" }).click();
    await expect(page).toHaveURL("/admin");
    await expect(page.locator('[data-seccion="Contenido"]')).toBeVisible();

    // Y la marca ya no está: vuelve a entrar con la suya sin pasar por el cambio.
    await page.context().clearCookies();
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill("MiClaveDePrueba2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/admin");
  } finally {
    await borrarUsuarioPorCorreo(correo);
    await borrarUsuario(admin.id);
  }
});

test("una cuenta desactivada ya no entra, y reactivada vuelve a entrar", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const otra = await crearUsuario("repartidor");
  try {
    await page.goto(`/admin/usuarios/${otra.id}`);
    await page.getByRole("button", { name: "Desactivar la cuenta" }).click();
    await expect(page.getByText("Cuenta desactivada. Ya no puede entrar.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reactivar la cuenta" })).toBeVisible();

    const suya = await intentarEntrar(browser, otra.correo, otra.clave);
    await expect(suya.getByTestId("error-ingreso")).toContainText("Esta cuenta está suspendida");
    await suya.context().close();

    await page.getByRole("button", { name: "Reactivar la cuenta" }).click();
    await expect(page.getByText("Cuenta reactivada.")).toBeVisible();
    const deNuevo = await intentarEntrar(browser, otra.correo, otra.clave);
    await expect(deNuevo).toHaveURL("/admin");
    await deNuevo.context().close();
  } finally {
    await borrarUsuario(otra.id);
    await borrarUsuario(admin.id);
  }
});

test("una contraseña temporal nueva sustituye a la anterior y obliga a cambiarla", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const otra = await crearUsuario("ingeniero");
  try {
    await page.goto(`/admin/usuarios/${otra.id}`);
    await page.getByRole("button", { name: "Darle una contraseña temporal nueva" }).click();
    const clave = (await page.locator("[data-clave]").textContent())?.trim() ?? "";
    expect(clave).toMatch(/^[A-HJ-NP-Za-km-z2-9]{12}$/);

    const conLaVieja = await intentarEntrar(browser, otra.correo, otra.clave);
    await expect(conLaVieja.getByTestId("error-ingreso")).toContainText(
      "El correo o la contraseña no son correctos",
    );
    await conLaVieja.context().close();

    const conLaNueva = await intentarEntrar(browser, otra.correo, clave);
    await expect(conLaNueva).toHaveURL("/cambiar-clave");
    await conLaNueva.context().close();
  } finally {
    await borrarUsuario(otra.id);
    await borrarUsuario(admin.id);
  }
});

test("en su propia ficha, el administrador no tiene botones para quitarse el acceso", async ({
  page,
}) => {
  const admin = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/usuarios/${admin.id}`);
    await expect(page.getByText("Esta es tu cuenta")).toBeVisible();
    await expect(page.getByRole("button", { name: "Desactivar la cuenta" })).toHaveCount(0);
    // Solo su rol, fijo: no puede elegir otro.
    await expect(page.getByRole("radio")).toHaveCount(1);
  } finally {
    await borrarUsuario(admin.id);
  }
});

test("el administrador no toca el acceso de un superadmin", async ({ page }) => {
  const admin = await entrarComo(page, "administrador");
  const jefe = await crearUsuario("superadmin");
  try {
    await page.goto(`/admin/usuarios/${jefe.id}`);
    await expect(
      page.getByText("Solo el super administrador cambia el acceso de esta cuenta."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Desactivar la cuenta" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Darle una contraseña temporal nueva" }),
    ).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(1);
    await expect(page.getByRole("radio", { name: /Super administrador/ })).toBeChecked();
  } finally {
    await borrarUsuario(jefe.id);
    await borrarUsuario(admin.id);
  }
});

test("aunque llame a la acción a mano, un administrador no le cambia la contraseña a un superadmin", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const otra = await crearUsuario("repartidor");
  const jefe = await crearUsuario("superadmin");
  try {
    // En la ficha de un superadmin el botón no existe: se pulsa en la de otra
    // cuenta y la petición se reescribe para apuntar al superadmin.
    const estado = await apuntarLaAccionA(page, otra.id, jefe.id);

    await page.goto(`/admin/usuarios/${otra.id}`);
    await page.getByRole("button", { name: "Darle una contraseña temporal nueva" }).click();
    await expect(
      page.getByText(
        "Solo el super administrador puede darle una contraseña nueva a un super administrador.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(estado.reescrita, "la petición de la acción no pasó por la reescritura").toBe(true);
    await expect(page.locator("[data-clave]")).toHaveCount(0);

    // Y la contraseña del superadmin sigue siendo la suya.
    const suya = await intentarEntrar(browser, jefe.correo, jefe.clave);
    await expect(suya).toHaveURL("/admin");
    await suya.context().close();
  } finally {
    await borrarUsuario(jefe.id);
    await borrarUsuario(otra.id);
    await borrarUsuario(admin.id);
  }
});

test("un administrador no le cambia la contraseña a otro administrador, ni llamando a la acción a mano", async ({
  page,
  browser,
}) => {
  const admin = await entrarComo(page, "administrador");
  const otra = await crearUsuario("repartidor");
  const colega = await crearUsuario("administrador");
  try {
    // En la ficha del colega puede desactivarlo, pero no darle contraseña.
    await page.goto(`/admin/usuarios/${colega.id}`);
    await expect(page.getByRole("button", { name: "Desactivar la cuenta" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Darle una contraseña temporal nueva" }),
    ).toHaveCount(0);

    const estado = await apuntarLaAccionA(page, otra.id, colega.id);
    await page.goto(`/admin/usuarios/${otra.id}`);
    await page.getByRole("button", { name: "Darle una contraseña temporal nueva" }).click();
    await expect(
      page.getByText(
        "Solo el super administrador puede darle una contraseña nueva a un administrador.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(estado.reescrita, "la petición de la acción no pasó por la reescritura").toBe(true);
    await expect(page.locator("[data-clave]")).toHaveCount(0);

    const suya = await intentarEntrar(browser, colega.correo, colega.clave);
    await expect(suya).toHaveURL("/admin");
    await suya.context().close();
  } finally {
    await borrarUsuario(colega.id);
    await borrarUsuario(otra.id);
    await borrarUsuario(admin.id);
  }
});

test("el superadmin elimina una cuenta nombrándola antes, y esa cuenta ya no entra", async ({
  page,
  browser,
}) => {
  const jefe = await entrarComo(page, "superadmin");
  const otra = await crearUsuario("repartidor");
  try {
    await page.goto(`/admin/usuarios/${otra.id}`);
    // La ficha lleva un id, así que no está en RUTAS_DEL_PANEL: axe se pasa
    // aquí, con todos los botones de acceso a la vista.
    await page.getByRole("button", { name: "Desactivar la cuenta" }).waitFor();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByRole("button", { name: "Borrar la cuenta de Prueba repartidor" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "¿Borrar la cuenta de Prueba repartidor?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page).toHaveURL("/admin/usuarios");
    // La lista ya cargó (se ve la cuenta de quien borra) y la borrada no está.
    await expect(page.getByText(jefe.correo)).not.toHaveCount(0);
    await expect(page.getByText(otra.correo)).toHaveCount(0);

    const suya = await intentarEntrar(browser, otra.correo, otra.clave);
    await expect(suya.getByTestId("error-ingreso")).toContainText("Esta cuenta está suspendida");
    await suya.context().close();
  } finally {
    await borrarUsuario(otra.id);
    await borrarUsuario(jefe.id);
  }
});

test("el ingeniero no entra a usuarios", async ({ page }) => {
  const inge = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/usuarios");
    await expect(page).toHaveURL("/admin?motivo=sin-acceso");
  } finally {
    await borrarUsuario(inge.id);
  }
});
