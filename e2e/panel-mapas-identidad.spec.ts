import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { borrarClienteDePrueba } from "./ayudas/clientes";
import { entrarComo } from "./ayudas/sesion";
import { supabaseLocal } from "./ayudas/supabase-local";
import { borrarUsuario } from "./ayudas/usuarios";

test("los enlaces del mapa de clientes conservan la identidad al abrir, pasar el puntero y enfocar", async ({
  page,
}, info) => {
  const nombre = `Cliente mapa identidad ${Date.now()}`;
  const usuario = await entrarComo(page, "administrador");
  let id: string | null = null;
  try {
    const { apiUrl, anonKey } = supabaseLocal();
    const api = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
    const acceso = await api.auth.signInWithPassword({
      email: usuario.correo,
      password: usuario.clave,
    });
    expect(acceso.error).toBeNull();
    const zona = await api.from("zonas_reparto").select("id").eq("nombre", "Belén").single();
    expect(zona.error).toBeNull();
    const alta = await api.rpc("registrar_cliente", {
      p_cliente: {
        nombre_completo: nombre,
        celular: `9${String(Date.now()).slice(-8)}`,
        direccion: "Jirón Próspero 100",
        referencia: "Portón verde",
        zona_id: zona.data!.id,
        latitud: -3.747321,
        longitud: -73.251114,
      },
      p_version_texto: "v1-2026-10",
    });
    expect(alta.error).toBeNull();
    id = alta.data as string;
    await page.goto(`/admin/clientes?vista=mapa&q=${encodeURIComponent(nombre)}`);
    const marcador = page.locator(`.leaflet-marker-icon[title="${nombre}"]`);
    await expect(marcador).toBeVisible();
    if (info.project.name === "movil") await marcador.tap();
    else await marcador.click();
    const ficha = page.getByRole("link", { name: "Ver ficha", exact: true });
    await expect(ficha).toBeVisible();
    await expect(ficha).toHaveAttribute("href", `/admin/clientes/${id}`);
    const primario = await page.evaluate(() => {
      const muestra = document.createElement("span");
      muestra.style.color = "var(--primary)";
      document.body.append(muestra);
      const color = getComputedStyle(muestra).color;
      muestra.remove();
      return color;
    });
    for (const enlace of [ficha, page.getByRole("link", { name: "OpenStreetMap", exact: true })]) {
      await expect(enlace).toHaveCSS("color", primario);
      await enlace.hover();
      await expect(enlace).toHaveCSS("color", primario);
      await enlace.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(enlace).toBeFocused();
      await expect(enlace).toHaveCSS("color", primario);
      expect(await enlace.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe("none");
    }
    await page.goto("/admin/clientes/nuevo");
    await page.getByRole("tab", { name: "Ubicación y fotos", exact: true }).click();
    const atribucion = page.getByRole("link", { name: "OpenStreetMap", exact: true });
    await expect(atribucion).toBeVisible();
    await expect(atribucion).toHaveCSS("color", primario);
    const pinturasAzules = await page.locator(".leaflet-container svg *").evaluateAll((elementos) =>
      elementos
        .filter((e) => e.getClientRects().length)
        .flatMap((e) =>
          ["fill", "stroke"].flatMap((propiedad) => {
            const valor = getComputedStyle(e).getPropertyValue(propiedad);
            const canales = valor.match(/^rgb\((\d+), (\d+), (\d+)\)/);
            if (!canales) return [];
            const [rojo, verde, azul] = canales.slice(1).map(Number);
            return azul > rojo + 20 && azul > verde + 10 ? [valor] : [];
          }),
        ),
    );
    expect(pinturasAzules).toEqual([]);
  } finally {
    await borrarUsuario(usuario.id);
    if (id) await borrarClienteDePrueba(id);
  }
});
