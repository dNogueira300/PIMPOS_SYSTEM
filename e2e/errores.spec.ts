import { expect, test } from "@playwright/test";

/**
 * Las paginas de "no encontrado" (critica de diseno del 11/09/2026, P1).
 *
 * Antes eran las de Next: en ingles, sobre blanco y, en una direccion que no
 * existe, sin cabecera ni pie. Quien llegaba por un enlace viejo reenviado por
 * WhatsApp se quedaba sin salida. Lo que se vigila: que respondan 404 de
 * verdad, que hablen en espanol y que siempre dejen por donde seguir.
 *
 * La pagina de error (`error.tsx`) no tiene prueba aqui, y es a proposito: no
 * hay forma de provocar un fallo del servidor en el build sin meter en
 * produccion una ruta que falle a demanda. Se verifico a mano; ver el doc 03.
 */

const CASOS = [
  // La raiz: `app/not-found.tsx`, que no pasa por el layout del sitio publico.
  { caso: "una direccion que no existe", ruta: "/esto-no-existe" },
  // Un `notFound()` dentro de una seccion: `app/(public)/not-found.tsx`.
  { caso: "un producto que no existe", ruta: "/productos/pan-que-no-existe" },
] as const;

for (const { caso, ruta } of CASOS) {
  test(`${caso}: 404 en espanol, con cabecera y por donde seguir`, async ({ page }) => {
    const respuesta = await page.goto(ruta);
    // 404 y no 200: un "no encontrado" que responde 200 lo toma el buscador
    // por una pagina buena.
    expect(respuesta?.status()).toBe(404);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("No encontramos esta página");
    await expect(page.getByText(/could not be found/i)).toHaveCount(0);
    // "Página no encontrada" en la raiz y "Producto no encontrado" en una ficha:
    // el `generateMetadata` de la ficha manda sobre el del `not-found`, y el
    // titulo concreto dice mas en la pestana. Lo que no puede salir es el de
    // Next ni un titulo vacio.
    await expect(page).toHaveTitle(/(Página|Producto) no encontrad[ao] · Panadería Pimpo's/);

    // La misma cabecera y el mismo pie que el resto del sitio: desde aqui se
    // llega a cualquier seccion sin volver atras.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Y dentro, las tres salidas que busca quien se perdio: lo que se vende,
    // el inicio y preguntar.
    const principal = page.getByRole("main");
    await expect(principal.getByRole("link", { name: "Ver el catálogo" })).toHaveAttribute(
      "href",
      "/productos",
    );
    await expect(principal.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(principal.locator('a[href^="https://wa.me/"]')).toHaveCount(1);

    // Fuera del indice. Next lo pone solo en las respuestas 404; si algun dia
    // esta pagina respondiera 200, esto tambien lo delataria.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}
