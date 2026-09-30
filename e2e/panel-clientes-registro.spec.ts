import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { fotoDePrueba } from "./ayudas/foto";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(
    info.project.name !== "movil",
    "el registro se hace desde el celular o la computadora; uno basta",
  );
});

async function idPorNombre(nombre: string): Promise<string[]> {
  const { data } = await (
    await sesionDeApi("administrador")
  )
    .from("clientes")
    .select("id")
    .eq("nombre_completo", nombre);
  return (data ?? []).map((c) => c.id);
}

async function llenarDatos(page: import("@playwright/test").Page, nombre: string, celular: string) {
  await page.goto("/admin/clientes/nuevo");
  await page.getByLabel("Nombre y apellido").fill(nombre);
  await page.getByLabel("Celular").fill(celular);
  await page.getByLabel("Dirección").fill("Jirón Próspero 450");
  await page.getByLabel("Referencia").fill("Portón verde, frente a la bodega");
  await page.getByLabel("Zona").selectOption({ label: "Belén" });
}

test("el ingeniero registra con permiso y punto, y añade la foto de la fachada", async ({
  page,
  context,
}) => {
  const nombre = `Registro E2E ${Date.now()}`;
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -3.7612, longitude: -73.2489 });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "+51 912 345 678");
    await page.getByRole("tab", { name: "Ubicación y fotos" }).click();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();
    await expect(page.locator("[data-fotos-bloqueadas]")).toBeVisible();
    await page.getByRole("tab", { name: "Permiso" }).click();
    await expect(page.locator("[data-texto-permiso]")).toContainText("tres fotos de la fachada");
    await page.getByLabel("Se lo leí y aceptó").check();
    await page.getByRole("button", { name: "Guardar" }).click();

    await page.waitForURL(/\/admin\/clientes\/[0-9a-f-]{36}\/editar\?pestana=fotos/);
    await page
      .getByLabel(/Elegir de la galería para Añadir una foto de la fachada/)
      .setInputFiles(await fotoDePrueba(page));
    await expect(page.getByRole("img", { name: "Fachada de la casa, foto 1" })).toBeVisible();

    const [id] = await idPorNombre(nombre);
    await page.goto(`/admin/clientes/${id}`);
    await expect(page.getByText("912 345 678")).toBeVisible(); // guardado normalizado, sin el 51
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      /destination=-3\.7612,-73\.2489/,
    );
  } finally {
    for (const id of await idPorNombre(nombre)) await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("sin el permiso marcado no se guarda, y lo dice en su pestaña", async ({ page }) => {
  const nombre = `Sin Permiso E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "912000111");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Léele el texto y marca «Se lo leí y aceptó»")).toBeVisible();
    expect(await idPorNombre(nombre)).toHaveLength(0);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("un celular repetido avisa con enlace a su ficha, y deja seguir", async ({ page }) => {
  const marca = Date.now();
  const celular = `9${String(marca).slice(-8)}`;
  const existente = await crearClienteDePrueba({ nombre: `Dueña E2E ${marca}`, celular });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(
      page,
      `Pariente E2E ${marca}`,
      `${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}`,
    );
    await page.getByLabel("Dirección").click(); // sale del celular: se comprueba
    const aviso = page.locator("[data-celular-repetido]");
    await expect(aviso).toContainText(`Dueña E2E ${marca}`);
    await expect(aviso.getByRole("link", { name: "Ver su ficha" })).toHaveAttribute(
      "href",
      `/admin/clientes/${existente}`,
    );
  } finally {
    await borrarClienteDePrueba(existente);
    await borrarUsuario(usuario.id);
  }
});

test("el alta pulsada dos veces no deja dos clientes (Review Focus)", async ({ page }) => {
  const nombre = `Doble E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await llenarDatos(page, nombre, "912000222");
    await page.getByRole("tab", { name: "Permiso" }).click();
    await page.getByLabel("Se lo leí y aceptó").check();
    await page.getByRole("button", { name: "Guardar" }).dblclick();
    await page.waitForURL(/\/editar\?pestana=fotos/);
    expect(await idPorNombre(nombre)).toHaveLength(1);
  } finally {
    for (const id of await idPorNombre(nombre)) await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("el repartidor corrige la referencia y el punto, y no llega a editar datos", async ({
  page,
  context,
}) => {
  const id = await crearClienteDePrueba({ nombre: `Corregir E2E ${Date.now()}` });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -3.7555, longitude: -73.2444 });
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto(`/admin/clientes/${id}/editar`);
    await page.waitForURL(`/admin/clientes/${id}/corregir`);
    await expect(page.getByLabel("Nombre y apellido")).toHaveCount(0);
    await page.getByLabel("Referencia").fill("Portón azul, al lado de la farmacia");
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL(`/admin/clientes/${id}`);
    await expect(page.getByText("Portón azul, al lado de la farmacia")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      /-3\.7555,-73\.2444/,
    );
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero desactiva y reactiva a un cliente", async ({ page }) => {
  const nombre = `Desactivar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Desactivar" }).click();
    await expect(page.getByText("Desactivado: no sale en la lista ni en el mapa.")).toBeVisible();
    await page.goto(`/admin/clientes?q=${encodeURIComponent(nombre)}&estado=desactivados`);
    await expect(page.getByRole("link", { name: new RegExp(nombre) }).first()).toBeVisible();
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Reactivar" }).click();
    await expect(page.getByText("Desactivado: no sale en la lista ni en el mapa.")).toHaveCount(0);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

// ---------------------------------------------------------------------------
// Revisión de la rama (T3 + T4)
// ---------------------------------------------------------------------------

test("un nombre con código no se ejecuta en el mapa de la ficha", async ({ page }) => {
  const marca = Date.now();
  const nombre = `<img src=x onerror="document.title='XSS-${marca}'"> Cliente ${marca}`;
  const id = await crearClienteDePrueba({ nombre, latitud: -3.7595, longitud: -73.2516 });
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/clientes/${id}`);
    const marcador = page.locator(".leaflet-marker-icon").first();
    await marcador.click();
    const globo = page.locator(".leaflet-popup-content");
    await expect(globo).toContainText(`<img src=x onerror=`);
    await expect(globo.locator("img")).toHaveCount(0);
    expect(await page.title()).not.toContain("XSS");
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("el mapa del alta se dibuja entero al abrir su pestaña", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/clientes/nuevo");
    // El mapa se crea con la pestaña todavía oculta (lo normal: la persona
    // rellena los datos primero). Se espera a que exista antes de abrirla.
    await page
      .locator("[data-selector-ubicacion].leaflet-container")
      .waitFor({ state: "attached" });
    await page.getByRole("tab", { name: "Ubicación y fotos" }).click();
    // Con el tamaño 0 que Leaflet leyó en la pestaña oculta, pedía UNA sola
    // tesela y el resto del mapa quedaba gris.
    await expect
      .poll(() => page.locator("[data-selector-ubicacion] .leaflet-tile").count())
      .toBeGreaterThan(3);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("añadir una foto no deja «cambios sin guardar» en el formulario", async ({ page }) => {
  const id = await crearClienteDePrueba({ nombre: `Foto Sin Borrador ${Date.now()}` });
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto(`/admin/clientes/${id}/corregir`);
    // Subir antes de que React hidrate se pierde (AGENTS.md); escribir en un
    // campo crearía justo la copia local que se quiere evitar. El mapa solo
    // existe cuando el componente ya se montó.
    await page.locator("[data-selector-ubicacion].leaflet-container").waitFor();
    await page
      .getByLabel(/Elegir de la galería para Añadir una foto de la fachada/)
      .setInputFiles(await fotoDePrueba(page));
    await expect(page.getByRole("img", { name: "Fachada de la casa, foto 1" })).toBeVisible();
    // Más que la pausa de la copia local, por si la hubiera escrito.
    await page.waitForTimeout(1500);
    await page.getByRole("link", { name: "Cancelar" }).click();
    await page.waitForURL(`/admin/clientes/${id}`);
    await page.goto(`/admin/clientes/${id}/corregir`);
    await expect(page.getByLabel("Referencia")).toBeVisible();
    await expect(page.locator("[data-borrador]")).toHaveCount(0);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("elegir una zona en la vista Mapa se queda en el mapa", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto("/admin/clientes?vista=mapa");
    await page.getByLabel("Zona").selectOption({ label: "Punchana" });
    await expect(page).toHaveURL(/zona=.+/);
    await expect(page).toHaveURL(/vista=mapa/);
    await expect(page.getByRole("link", { name: "Mapa" })).toHaveAttribute("aria-current", "page");
  } finally {
    await borrarUsuario(usuario.id);
  }
});
