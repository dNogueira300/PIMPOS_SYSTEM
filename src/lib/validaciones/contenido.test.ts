import { describe, expect, it } from "vitest";

import {
  esquemaFaq,
  esquemaFotoGaleria,
  esquemaGuia,
  esquemaSlide,
  esquemaTestimonio,
  leerFaq,
  leerFotoGaleria,
  leerGuia,
  leerSlide,
  leerTestimonio,
} from "./contenido";

const fd = (pares: Record<string, string>) => {
  const d = new FormData();
  for (const [k, v] of Object.entries(pares)) d.set(k, v);
  return d;
};
const mensajes = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : (r.error?.issues.map((i) => i.message) ?? []);

describe("slide", () => {
  const base = {
    titulo: "Pan caliente a las 4",
    imagen_url: "slides/a.webp",
    imagen_alt: "Bandeja de pan",
    enfoque: "50",
  };

  it("sin botón es válido", () => {
    expect(esquemaSlide.safeParse(leerSlide(fd(base))).success).toBe(true);
  });

  it("un enlace sin texto de botón pide el texto (la base lo exige: slide_boton_coherente)", () => {
    expect(
      mensajes(esquemaSlide.safeParse(leerSlide(fd({ ...base, enlace_url: "/productos" })))),
    ).toContain("Si el slide lleva botón, escribe el texto y el enlace.");
  });

  it("un enlace tiene que ser del sitio o empezar por https://", () => {
    expect(
      mensajes(
        esquemaSlide.safeParse(
          leerSlide(fd({ ...base, enlace_url: "javascript:alert(1)", texto_boton: "Ver" })),
        ),
      ),
    ).toContain("El enlace tiene que empezar por / o por https://");
  });

  it("sin foto grande no se guarda", () => {
    expect(mensajes(esquemaSlide.safeParse(leerSlide(fd({ ...base, imagen_url: "" }))))).toContain(
      "Sube la foto del slide.",
    );
  });

  it("el enfoque va de 0 a 100", () => {
    expect(esquemaSlide.safeParse(leerSlide(fd({ ...base, enfoque: "120" }))).success).toBe(false);
  });
});

describe("foto de galería", () => {
  it("exige texto alternativo: estas fotos comunican", () => {
    expect(
      mensajes(
        esquemaFotoGaleria.safeParse(
          leerFotoGaleria(fd({ ruta: "panel/a.webp", categoria: "hornos" })),
        ),
      ),
    ).toContain("Describe la foto para quien no puede verla.");
  });

  it("solo acepta las cinco categorías de la base", () => {
    expect(
      esquemaFotoGaleria.safeParse(
        leerFotoGaleria(fd({ ruta: "a.webp", alt: "Horno", categoria: "cocina" })),
      ).success,
    ).toBe(false);
  });
});

describe("pregunta, guía y testimonio", () => {
  it("una pregunta sin respuesta pide escribirla", () => {
    expect(mensajes(esquemaFaq.safeParse(leerFaq(fd({ pregunta: "¿Hacen delivery?" }))))).toContain(
      "Escribe la respuesta.",
    );
  });

  it("una guía válida", () => {
    expect(
      esquemaGuia.safeParse(
        leerGuia(fd({ titulo: "Cómo hacer un pedido", contenido: "Escríbenos por WhatsApp." })),
      ).success,
    ).toBe(true);
  });

  it("un testimonio sin nombre se rechaza", () => {
    expect(
      mensajes(esquemaTestimonio.safeParse(leerTestimonio(fd({ texto: "Muy rico." })))),
    ).toContain("Escribe el nombre de quien lo dice.");
  });
});
