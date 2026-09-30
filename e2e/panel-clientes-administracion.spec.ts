import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { sqlLocal } from "./ayudas/base";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "escriben filas compartidas (zonas); un proyecto basta");
});

test("la administración crea una zona, no la puede retirar con clientes activos, y sí vacía", async ({
  page,
}) => {
  const nombre = `Zona E2E ${Date.now()}`;
  const usuario = await entrarComo(page, "administrador");
  let cliente: string | null = null;
  try {
    await page.goto("/admin/clientes/zonas/nueva");
    await page.getByLabel("Nombre de la zona").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL("/admin/clientes/zonas");

    cliente = await crearClienteDePrueba({ nombre: `En ${nombre}`, zona: nombre });
    await page.reload();
    await page.getByRole("button", { name: `Retirar la zona ${nombre}` }).click();
    await expect(page.getByText(/tiene 1 cliente activo\. Pásalos a otra zona/)).toBeVisible();

    await borrarClienteDePrueba(cliente);
    cliente = null;
    await page.reload();
    await page.getByRole("button", { name: `Retirar la zona ${nombre}` }).click();
    await expect(page.getByRole("button", { name: `Activar la zona ${nombre}` })).toBeVisible();
  } finally {
    if (cliente) await borrarClienteDePrueba(cliente);
    sqlLocal(`delete from public.zonas_reparto where nombre = '${nombre}'`);
    await borrarUsuario(usuario.id);
  }
});

test("el ingeniero no llega a las zonas ni a la lista para revisar", async ({ page }) => {
  const usuario = await entrarComo(page, "ingeniero");
  try {
    for (const ruta of ["/admin/clientes/zonas", "/admin/clientes/revisar"]) {
      await page.goto(ruta);
      await page.waitForURL("/admin?motivo=sin-acceso");
    }
  } finally {
    await borrarUsuario(usuario.id);
  }
});

test("borrar los datos a pedido: pide motivo, borra datos y fotos, y deja la constancia", async ({
  page,
}) => {
  const nombre = `Borrar E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  const api = await sesionDeApi("administrador");
  await api.storage
    .from("clientes")
    .upload(`${id}/fachada.webp`, new Blob([new Uint8Array(64)], { type: "image/webp" }));
  await api.from("cliente_fotos").insert({ cliente_id: id, ruta: `${id}/fachada.webp`, orden: 1 });
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await page.getByRole("button", { name: "Borrar sus datos" }).click();
    await page.getByRole("button", { name: "Sí, borrar sus datos" }).click();
    await expect(page.getByText("Escribe por qué")).toBeVisible(); // sin motivo no borra
    await page.getByLabel(/¿Por qué\?/).fill("Lo pidió por WhatsApp");
    await page.getByRole("button", { name: "Sí, borrar sus datos" }).click();
    await expect(page.locator("[data-datos-borrados]")).toBeVisible();
    await expect(page.getByText(nombre)).toHaveCount(0);

    const { data: archivos } = await api.storage.from("clientes").list(id);
    expect(archivos ?? []).toHaveLength(0);
    const { data: supresion } = await api
      .from("supresiones")
      .select("motivo")
      .eq("cliente_id", id)
      .single();
    expect(supresion?.motivo).toBe("Lo pidió por WhatsApp");
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("un cliente de hace dos años sale en el inicio y en «Para revisar»; «Sigue siendo cliente» lo quita", async ({
  page,
}) => {
  const nombre = `Viejo E2E ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  // Envejecerlo (la ficha y su permiso: la vista mira los dos) sin que el
  // trigger ponga la fecha de hoy.
  sqlLocal(`
    alter table public.clientes disable trigger clientes_set_updated_at;
    update public.clientes set updated_at = now() - interval '2 years 1 day' where id = '${id}';
    alter table public.clientes enable trigger clientes_set_updated_at;
    update public.consentimientos set created_at = now() - interval '3 years' where cliente_id = '${id}';`);
  const usuario = await entrarComo(page, "administrador");
  try {
    await expect(page.locator('[data-aviso="clientes-para-revisar"]')).toBeVisible();
    await page.goto("/admin/clientes/revisar");
    await expect(page.getByRole("link", { name: new RegExp(nombre) }).first()).toBeVisible();

    await page.getByRole("button", { name: `${nombre} sigue siendo cliente` }).click();
    await expect(page.getByRole("link", { name: new RegExp(nombre) })).toHaveCount(0);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

// ---------------------------------------------------------------------------
// Revisión de la rama (T5 + T6)
// ---------------------------------------------------------------------------

const POLITICA_BORRAR_FOTOS = `
  create policy "encargados borran fotos de clientes"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'clientes'
      and (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
      and app.carpeta_es_cliente_visible(name)
    );`;

/** La vista mira la ficha, sus fotos y su permiso: se envejecen los tres. */
function envejecer(id: string) {
  sqlLocal(`
    alter table public.clientes disable trigger clientes_set_updated_at;
    update public.clientes set updated_at = now() - interval '2 years 1 day' where id = '${id}';
    alter table public.clientes enable trigger clientes_set_updated_at;
    update public.consentimientos set created_at = now() - interval '3 years' where cliente_id = '${id}';
    alter table public.cliente_fotos disable trigger cliente_fotos_set_updated_at;
    update public.cliente_fotos set updated_at = now() - interval '3 years' where cliente_id = '${id}';
    alter table public.cliente_fotos enable trigger cliente_fotos_set_updated_at;`);
}

test("si Storage no deja borrar las fotos, lleva a la ficha y ahí se reintenta (Review Focus)", async ({
  page,
}) => {
  const nombre = `Fotos Rebeldes ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  const api = await sesionDeApi("administrador");
  await api.storage
    .from("clientes")
    .upload(`${id}/fachada.webp`, new Blob([new Uint8Array(64)], { type: "image/webp" }));
  await api.from("cliente_fotos").insert({ cliente_id: id, ruta: `${id}/fachada.webp`, orden: 1 });
  envejecer(id);
  const usuario = await entrarComo(page, "administrador");
  try {
    // Storage falla después de que la base ya borró: sin política de borrado,
    // `remove()` no borra nada (y tampoco da error).
    sqlLocal(`drop policy "encargados borran fotos de clientes" on storage.objects;`);
    await page.goto("/admin/clientes/revisar");
    await page.getByRole("button", { name: `Borrar sus datos: ${nombre}` }).click();
    await page.getByLabel(/¿Por qué\?/).fill("Lo pidió en el local");
    await page.getByRole("button", { name: "Sí, borrar sus datos" }).click();

    // No se queda en una lista de la que el cliente ya salió: va a su ficha.
    await page.waitForURL(`/admin/clientes/${id}`);
    const reintentar = page.getByRole("button", { name: "Borrar las fotos que quedaron" });
    await expect(reintentar).toBeVisible();

    sqlLocal(POLITICA_BORRAR_FOTOS);
    await reintentar.click();
    await expect(reintentar).toHaveCount(0);
    const { data: archivos } = await api.storage.from("clientes").list(id);
    expect(archivos ?? []).toHaveLength(0);
  } finally {
    sqlLocal(`do $$ begin
      if not exists (select 1 from pg_policies where schemaname = 'storage'
                     and policyname = 'encargados borran fotos de clientes') then
        execute $p$${POLITICA_BORRAR_FOTOS}$p$;
      end if; end $$;`);
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});

test("«Sigue siendo cliente» no reactiva a quien otro acaba de desactivar", async ({ page }) => {
  const nombre = `Recien Desactivado ${Date.now()}`;
  const id = await crearClienteDePrueba({ nombre });
  envejecer(id);
  const usuario = await entrarComo(page, "administrador");
  try {
    await page.goto("/admin/clientes/revisar");
    await expect(
      page.getByRole("button", { name: `${nombre} sigue siendo cliente` }),
    ).toBeVisible();
    // Mientras tanto, otra persona lo desactiva desde su ficha.
    await (
      await sesionDeApi("administrador")
    )
      .from("clientes")
      .update({ activo: false })
      .eq("id", id);
    await page.getByRole("button", { name: `${nombre} sigue siendo cliente` }).click();
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible();
    const { data } = await (
      await sesionDeApi("administrador")
    )
      .from("clientes")
      .select("activo")
      .eq("id", id)
      .single();
    expect(data?.activo).toBe(false);
  } finally {
    await borrarClienteDePrueba(id);
    await borrarUsuario(usuario.id);
  }
});
