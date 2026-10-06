import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { borrarDeLaBase, sqlLocal } from "./ayudas/base";
import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sumarStock } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario, type UsuarioDePrueba } from "./ayudas/usuarios";

// De una en una: comparten la lista del historial y la actividad reciente.
test.describe.configure({ mode: "serial" });

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "no depende del tamaño de pantalla; un proyecto basta");
});

/** La misma persona que entró al panel, por la API: sus cambios quedan a su nombre. */
async function apiDe(usuario: UsuarioDePrueba) {
  const { apiUrl, anonKey } = supabaseLocal();
  const cliente = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({
    email: usuario.correo,
    password: usuario.clave,
  });
  if (error) throw new Error(`No se pudo entrar por la API: ${error.message}`);
  return cliente;
}

/**
 * Un producto propio de la prueba, guardado dos veces como lo guarda el
 * formulario del panel (`guardar_producto`, 0027): la segunda le sube el
 * precio. Ese guardado deja varias filas en el registro —el producto sin
 * cambios, la marca de presentación principal quitada y vuelta a poner— y el
 * historial tiene que enseñar una sola línea: el precio.
 */
async function cambiarUnPrecio(usuario: UsuarioDePrueba) {
  const api = await apiDe(usuario);
  const { data: categoria } = await api
    .from("categorias_producto")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .single();
  if (!categoria) throw new Error("No hay categorías en la semilla");
  const marca = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const producto = {
    categoria_id: categoria.id,
    nombre: `Pan de prueba ${marca}`,
    slug: `pan-de-prueba-${marca}`,
    descripcion: "",
    destacado: false,
    // Borrador: no llega al sitio público.
    estado: "borrador",
  };
  const antes = 0.2;
  const despues = 0.25;
  const alta = await api.rpc("guardar_producto", {
    p_producto: producto,
    p_presentaciones: [{ nombre: "Unidad", precio: antes, unidad_venta: "unidad" }],
  });
  if (alta.error) throw new Error(`No se pudo crear el producto: ${alta.error.message}`);
  const productoId = alta.data as string;
  const { data: variante } = await api
    .from("producto_variantes")
    .select("id")
    .eq("producto_id", productoId)
    .single();
  const cambio = await api.rpc("guardar_producto", {
    p_producto: { ...producto, id: productoId },
    p_presentaciones: [
      { id: variante?.id, nombre: "Unidad", precio: despues, unidad_venta: "unidad" },
    ],
  });
  if (cambio.error) throw new Error(`No se pudo cambiar el precio: ${cambio.error.message}`);
  return {
    productoId,
    antes,
    despues,
    /**
     * Antes de borrar al usuario: el producto lleva su `created_by`, y con él
     * vivo `borrarUsuario` falla sin avisar (AGENTS.md, trampas de F6). Las
     * presentaciones y su historial de precios se van en cascada.
     */
    restaurar: async () => {
      sqlLocal(`delete from public.productos where id = '${productoId}';`);
    },
  };
}

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

async function abrirHistorial(page: Page, consulta = "") {
  await page.goto(`/admin/auditoria${consulta}`);
  await expect(page.getByRole("heading", { name: "Historial", level: 1 })).toBeVisible();
}

test("la administración encuentra un cambio de precio, lo abre y ve el antes y el después", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    // Varias pruebas a la vez crean un «Prueba administrador»: se filtra por
    // esta persona, y de paso se prueba que el filtro de la dirección funciona.
    await abrirHistorial(page, `?seccion=productos&cuando=hoy&persona=${usuario.id}`);
    const fila = page.getByRole("link", {
      name: `Prueba administrador cambió la presentación`,
    });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText(`Precio ${soles(precio.antes)} → ${soles(precio.despues)}`);
    await fila.click();
    await page.waitForURL(/\/admin\/auditoria\/\d+$/);

    await expect(page.locator("[data-frase]")).toContainText("cambió la presentación");
    const diferencias = page.locator("[data-diferencias]");
    await expect(diferencias).toContainText("Precio");
    await expect(diferencias).toContainText(soles(precio.antes));
    await expect(diferencias).toContainText(soles(precio.despues));

    const tecnico = page.locator("[data-detalle-tecnico]");
    await expect(tecnico.getByText("public.producto_variantes")).toBeHidden();
    await tecnico.getByText("Detalle técnico").click();
    await expect(tecnico.getByText("public.producto_variantes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a donde se hizo" })).toHaveAttribute(
      "href",
      `/admin/contenido/productos/${precio.productoId}`,
    );
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("los filtros se aplican al elegir, sin recargar la página", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await abrirHistorial(page);
    await page.evaluate(() => {
      (window as unknown as { sinRecargar: boolean }).sinRecargar = true;
    });
    await page.getByLabel("Persona").selectOption(usuario.id);
    await expect(page).toHaveURL(new RegExp(`persona=${usuario.id}`));
    await page.getByLabel("Qué hizo").selectOption("cambio");
    await expect(page).toHaveURL(/hizo=cambio/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ }).first()).toBeVisible();
    // Con «Creó» ese cambio ya no está.
    await page.getByLabel("Qué hizo").selectOption("creo");
    await expect(page).toHaveURL(/hizo=creo/);
    await expect(page.getByRole("link", { name: /cambió la presentación/ })).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar),
    ).toBe(true);
    // Pulsar la pestaña vuelve a la dirección sin filtros, y los desplegables
    // tienen que decir lo mismo (el formulario no se desmonta: es la misma ruta).
    await page.getByRole("link", { name: "Cambios", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/auditoria$/);
    await expect(page.getByLabel("Persona")).toHaveValue("");
    await expect(page.getByLabel("Qué hizo")).toHaveValue("");
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("una dirección con filtros inventados no rompe la página (Review Focus)", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await abrirHistorial(
      page,
      "?persona=abc&seccion=otra&hizo=rompio&cuando=siempre&desde=ayer&ver=999999",
    );
    await expect(page.getByLabel("Cuándo")).toHaveValue("7");
    // No por `role="alert"`: Next deja siempre uno vacío, su anunciador de rutas.
    await expect(page.getByText("No se pudo cargar el historial")).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Cambios en el panel" })
        .or(page.getByText("No hay cambios con esos filtros")),
    ).toBeVisible();
    await page.goto("/admin/auditoria/no-es-un-numero");
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no ve «Historial» ni llega escribiendo la dirección", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await expect(page.locator('[data-seccion="Historial"]')).toHaveCount(0);
    await expect(page.locator("[data-actividad-reciente]")).toHaveCount(0);
    for (const ruta of [
      "/admin/auditoria/ingresos",
      "/admin/auditoria/borrados",
      "/admin/auditoria/descargas",
    ]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
    for (const ruta of ["/admin/auditoria", "/admin/auditoria/1"]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("«Ver historial» desde un producto trae también sus presentaciones", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await page.goto(`/admin/contenido/productos/${precio.productoId}`);
    await page.getByRole("link", { name: "Ver historial" }).click();
    await page.waitForURL(new RegExp(`registro=${precio.productoId}.*de=producto`));
    await expect(page.locator("[data-de-un-registro]")).toBeVisible();
    // El cambio fue en `producto_variantes`, no en `productos`: cuelga de él.
    await expect(page.getByRole("link", { name: /cambió la presentación/ }).first()).toBeVisible();
    // Sin filtro de sección: ya es de un solo registro.
    await expect(page.getByLabel("Sección")).toHaveCount(0);
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("Ingresos muestra el ingreso que la prueba acaba de hacer", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    // Además del ingreso por el formulario, uno por la API con su salida: la
    // revisión de la T1 pidió comprobar que la salida también queda anotada.
    const api = await apiDe(usuario);
    // `local`: la salida por defecto cierra TODAS las sesiones, también la del navegador.
    await api.auth.signOut({ scope: "local" });
    await page.goto(`/admin/auditoria/ingresos?persona=${usuario.id}&cuando=hoy`);
    const lista = page.getByRole("list", { name: "Ingresos y salidas" });
    await expect(lista.getByRole("listitem")).toHaveCount(3);
    await expect(lista.getByText("Prueba administrador entró")).toHaveCount(2);
    await expect(lista.getByText("Prueba administrador salió")).toHaveCount(1);
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("Datos borrados y Descargas muestran lo que dejan un borrado y una descarga", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const cliente = await crearClienteDePrueba({ nombre: `Borrable ${Date.now()}` });
  const motivo = `Lo pidió por teléfono ${Date.now()}`;
  try {
    const api = await apiDe(usuario);
    const { error } = await api.rpc("borrar_datos_cliente", { p_id: cliente, p_motivo: motivo });
    expect(error).toBeNull();
    // La descarga, con la sesión del navegador: queda anotada antes de salir el archivo.
    const descarga = await page.request.get("/admin/clientes/excel");
    expect(descarga.status()).toBe(200);

    await page.goto("/admin/auditoria/borrados");
    const constancia = page.getByRole("listitem").filter({ hasText: motivo });
    await expect(constancia).toContainText("Prueba administrador borró los datos de un cliente");
    await expect(constancia.getByRole("link", { name: "Ver la ficha" })).toHaveAttribute(
      "href",
      `/admin/clientes/${cliente}`,
    );

    // Otras pruebas descargan a la vez y todas son de «Prueba administrador»:
    // la fila se busca por su número.
    const { data: anotada } = await api
      .from("exportaciones_clientes")
      .select("id")
      .eq("exportado_por", usuario.id)
      .single();
    await page.goto("/admin/auditoria/descargas");
    const fila = page.locator(`[data-descarga="${anotada?.id}"]`);
    await expect(fila).toContainText("Prueba administrador descargó");
    await expect(fila).toContainText("Excel");
    await expect(fila).toContainText("activos");

    // Review Focus: el registro ya no tiene datos. El historial del cliente lo
    // dice y no enseña ninguno de sus datos.
    await page.goto(`/admin/clientes/${cliente}`);
    await page.getByRole("link", { name: "Ver historial" }).click();
    await expect(
      page.getByRole("link", { name: /cuyos datos se borraron a pedido/ }).first(),
    ).toBeVisible();
    await expect(page.getByText("Jirón Próspero 100")).toHaveCount(0);
  } finally {
    // Primero lo que apunta al usuario, al final el usuario (AGENTS.md, trampas de F6).
    await borrarDeLaBase("exportaciones_clientes", "exportado_por", usuario.id);
    await borrarClienteDePrueba(cliente);
    await borrarUsuario(usuario.id);
  }
});

test("el inicio enseña la actividad reciente solo a la administración", async ({ page }) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    // Un ajuste de stock deja, lo último del registro, filas de tablas
    // internas (el lote y el reparto entre lotes): no pueden salir aquí.
    await sumarStock("Sal", 1);
    await page.goto("/admin");
    const bloque = page.locator("[data-actividad-reciente]");
    await expect(bloque.getByRole("heading", { name: "Actividad reciente" })).toBeVisible();
    const filas = bloque.getByRole("listitem");
    expect(await filas.count()).toBeGreaterThan(0);
    expect(await filas.count()).toBeLessThanOrEqual(5);
    // Ninguna es de una tabla interna (lotes, reparto entre lotes, almacenes, roles).
    const ids = await bloque
      .locator("[data-cambio]")
      .evaluateAll((enlaces) => enlaces.map((e) => e.getAttribute("data-cambio")));
    expect(ids.length).toBeGreaterThan(0);
    const internas = sqlLocal(
      `select count(*) from app.auditoria where id in (${ids.join(",")}) and tabla in ('public.movimiento_lotes', 'public.lotes_insumo', 'public.almacenes', 'public.roles');`,
    ).trim();
    expect(internas).toBe("0");
    await expect(bloque.getByRole("link", { name: "Ver todo el historial" })).toHaveAttribute(
      "href",
      "/admin/auditoria",
    );
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("el detalle enseña el guardado entero, y «Ir a…» desaparece si el producto se borró después", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  const precio = await cambiarUnPrecio(usuario);
  try {
    await abrirHistorial(page, `?seccion=productos&cuando=hoy&persona=${usuario.id}`);
    await page.getByRole("link", { name: "Prueba administrador cambió la presentación" }).click();
    await page.waitForURL(/\/admin\/auditoria\/\d+$/);
    const direccion = page.url();

    // El guardado dejó dos filas sobre la presentación (quitar y volver a
    // poner la marca de principal): el detalle enseña solo el precio.
    const diferencias = page.locator("[data-diferencias]");
    await expect(diferencias).toContainText("Precio");
    await expect(diferencias).not.toContainText("Presentación principal");
    await page.locator("[data-detalle-tecnico]").getByText("Detalle técnico").click();
    await expect(page.locator("[data-mismo-guardado]").getByRole("link")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Ir a donde se hizo" })).toBeVisible();

    // Borrado como lo hace el panel: la fila sigue en la tabla, con su marca.
    sqlLocal(`update public.productos set deleted_at = now() where id = '${precio.productoId}';`);
    await page.goto(direccion);
    await expect(page.locator("[data-frase]")).toContainText("cambió la presentación");
    await expect(page.getByRole("link", { name: "Ir a donde se hizo" })).toHaveCount(0);
  } finally {
    await precio.restaurar();
    await borrarUsuario(usuario.id);
  }
});

test("«Ver historial» de un insumo trae el reparto entre lotes, dicho con el nombre del insumo", async ({
  page,
}) => {
  const usuario = await entrarComo(page, "administrador");
  try {
    await sumarStock("Sal", 1);
    const insumo = sqlLocal("select id from public.insumos where nombre = 'Sal';").trim();
    await page.goto(`/admin/insumos/${insumo}`);
    await page.getByRole("link", { name: "Ver historial" }).click();
    await expect(page.locator("[data-de-un-registro]")).toContainText("el insumo Sal");
    await expect(
      page
        .getByRole("link", { name: /apuntó en un lote de Sal la parte de un movimiento/ })
        .first(),
    ).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});
