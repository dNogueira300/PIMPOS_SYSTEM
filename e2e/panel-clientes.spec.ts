import { expect, test } from "@playwright/test";

import { borrarClienteDePrueba, crearClienteDePrueba } from "./ayudas/clientes";
import { sesionDeApi } from "./ayudas/insumos";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario } from "./ayudas/usuarios";

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "movil", "el reparto trabaja en el celular");
});

test("el repartidor encuentra a un cliente por nombre sin tildes y por celular con espacios", async ({
  page,
}) => {
  const marca = Date.now();
  const id = await crearClienteDePrueba({
    nombre: `Ñusta Pérez ${marca}`,
    celular: `9${String(marca).slice(-8)}`,
  });
  const celular = `9${String(marca).slice(-8)}`;
  const usuario = await entrarComo(page, "repartidor");
  try {
    await page
      .getByRole("navigation", { name: /barra inferior/ })
      .getByRole("link", { name: "Clientes" })
      .click();
    const buscador = page.getByRole("searchbox", { name: "Buscar cliente" });
    await buscador.fill(`nusta perez ${marca}`);
    await expect(
      page.getByRole("link", { name: new RegExp(`Ñusta Pérez ${marca}`) }).first(),
    ).toBeVisible();
    await buscador.fill(`${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}`);
    await expect(
      page.getByRole("link", { name: new RegExp(`Ñusta Pérez ${marca}`) }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: `Llamar: Ñusta Pérez ${marca}` })).toHaveAttribute(
      "href",
      `tel:+51${celular}`,
    );
    // El repartidor no da altas: no ve «Nuevo cliente», y su lápiz dice «Corregir».
    await expect(page.getByRole("link", { name: "Nuevo cliente" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: `Corregir Ñusta Pérez ${marca}` })).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(id);
  }
});

test("la ficha tiene sus botones, su permiso y la foto solo por URL firmada", async ({ page }) => {
  const marca = Date.now();
  const id = await crearClienteDePrueba({
    nombre: `Cliente Ficha ${marca}`,
    latitud: -3.7595,
    longitud: -73.2516,
  });
  // Una foto subida como lo haría el panel, con la sesión de un ingeniero.
  const ingeniero = await sesionDeApi("ingeniero");
  const ruta = `${id}/fachada-${marca}.webp`;
  const webp = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");
  const { error: errorSubida } = await ingeniero.storage
    .from("clientes")
    .upload(ruta, webp, { contentType: "image/webp" });
  expect(errorSubida).toBeNull();
  await ingeniero.from("cliente_fotos").insert({ cliente_id: id, ruta, orden: 1 });

  const usuario = await entrarComo(page, "repartidor");
  try {
    await page.goto(`/admin/clientes/${id}`);
    await expect(page.getByRole("heading", { name: `Cliente Ficha ${marca}` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-3.7595,-73.2516",
    );
    await expect(page.locator("[data-permiso]")).toContainText("v1-2026-10");

    const src = await page
      .getByRole("img", { name: /Fachada de la casa, foto 1/ })
      .getAttribute("src");
    expect(src).toContain("/storage/v1/object/sign/clientes/");
    // La firmada se ve…
    expect((await fetch(src!)).status).toBe(200);
    // …y la misma foto por la dirección pública no (bucket privado).
    const { apiUrl } = supabaseLocal();
    const publica = await fetch(`${apiUrl}/storage/v1/object/public/clientes/${ruta}`);
    expect(publica.status).toBeGreaterThanOrEqual(400);
    expect(publica.status).toBeLessThan(500);
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(id);
  }
});

test("la vista mapa enseña a los clientes con punto y dice cuántos no lo tienen", async ({
  page,
}) => {
  const marca = Date.now();
  const conPunto = await crearClienteDePrueba({
    nombre: `Con Punto ${marca}`,
    zona: "Punchana",
    latitud: -3.73,
    longitud: -73.24,
  });
  const sinPunto = await crearClienteDePrueba({ nombre: `Sin Punto ${marca}`, zona: "Punchana" });
  const usuario = await entrarComo(page, "ingeniero");
  try {
    await page.goto(`/admin/clientes?q=${marca}&vista=mapa`);
    await expect(page.getByRole("region", { name: "Mapa de clientes" })).toBeVisible();
    await expect(page.locator("[data-mapa-clientes] .leaflet-marker-icon")).toHaveCount(1);
    await expect(page.locator("[data-sin-punto]")).toContainText("1 cliente no tiene punto");
  } finally {
    await borrarUsuario(usuario.id);
    await borrarClienteDePrueba(conPunto);
    await borrarClienteDePrueba(sinPunto);
  }
});
