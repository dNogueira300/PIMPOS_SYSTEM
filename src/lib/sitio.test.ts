import { describe, expect, it } from "vitest";

import { urlAbsoluta, urlDelSitio } from "./sitio";

// Si esto sale mal no se ve en ninguna pantalla: el sitemap le diría a Google
// que el catálogo vive en localhost, y el enlace compartido por WhatsApp saldría
// sin foto. Por eso se prueba aparte.

describe("urlDelSitio", () => {
  it("usa la URL fijada a mano cuando existe", () => {
    expect(urlDelSitio({ NEXT_PUBLIC_SITE_URL: "https://panaderiapimpos.com" })).toBe(
      "https://panaderiapimpos.com",
    );
  });

  it("le gana a la de Vercel: el dominio propio manda", () => {
    expect(
      urlDelSitio({
        NEXT_PUBLIC_SITE_URL: "https://panaderiapimpos.com",
        VERCEL_PROJECT_PRODUCTION_URL: "pimpos.vercel.app",
      }),
    ).toBe("https://panaderiapimpos.com");
  });

  it("sin URL fijada, usa la de Vercel con https", () => {
    // Cubre desplegar antes de tener dominio sin publicar URLs de localhost.
    expect(urlDelSitio({ VERCEL_PROJECT_PRODUCTION_URL: "pimpos.vercel.app" })).toBe(
      "https://pimpos.vercel.app",
    );
  });

  it("sin nada, cae a localhost para desarrollo y CI", () => {
    expect(urlDelSitio({})).toBe("http://localhost:3000");
  });

  it("una variable con solo espacios cuenta como vacia", () => {
    // Un espacio pegado por error en el panel de Vercel no puede producir la
    // URL " " y romper todas las absolutas del sitio.
    expect(urlDelSitio({ NEXT_PUBLIC_SITE_URL: "   " })).toBe("http://localhost:3000");
  });

  it("quita la barra final", () => {
    // Con la barra, `/productos` se convertiría en `//productos`, que para un
    // buscador es otra URL y parte la página en dos entradas del índice.
    expect(urlDelSitio({ NEXT_PUBLIC_SITE_URL: "https://panaderiapimpos.com/" })).toBe(
      "https://panaderiapimpos.com",
    );
  });
});

describe("urlAbsoluta", () => {
  const entorno = { NEXT_PUBLIC_SITE_URL: "https://panaderiapimpos.com/" };

  it("compone la ruta con una sola barra", () => {
    expect(urlAbsoluta("/productos", entorno)).toBe("https://panaderiapimpos.com/productos");
    expect(urlAbsoluta("productos", entorno)).toBe("https://panaderiapimpos.com/productos");
  });

  it("deja tal cual una URL que ya es absoluta", () => {
    // Una foto en Storage ya viene con su dominio: anteponerle el del sitio la
    // rompería.
    expect(urlAbsoluta("https://x.supabase.co/storage/v1/a.webp", entorno)).toBe(
      "https://x.supabase.co/storage/v1/a.webp",
    );
  });
});
