import { describe, expect, it } from "vitest";

import { DISENOS, SLUGS_CON_DISENO, alternativaDe, esSlugConDiseno } from "./disenos";
import { ESTILOS } from "./estilos";

describe("el catálogo de temáticas con diseño", () => {
  it("tiene Navidad, el Día de la Madre, Halloween y el Día de la Canción Criolla", () => {
    expect(SLUGS_CON_DISENO).toEqual([
      "navidad",
      "dia-de-la-madre",
      "halloween",
      "cancion-criolla",
    ]);
    expect(esSlugConDiseno("dia-de-la-madre")).toBe(true);
    expect(esSlugConDiseno("san-juan")).toBe(false);
    expect(esSlugConDiseno(null)).toBe(false);
  });

  it("los estilos no se repiten entre temáticas, y entre todas son ESTILOS", () => {
    const valores = SLUGS_CON_DISENO.flatMap((s) => DISENOS[s].estilos.map((e) => e.valor));
    expect(new Set(valores).size).toBe(valores.length);
    expect([...valores].sort()).toEqual([...ESTILOS].sort());
  });

  it("cada estilo dice cómo viste el sitio", () => {
    for (const slug of SLUGS_CON_DISENO) {
      for (const estilo of DISENOS[slug].estilos) {
        expect(estilo.nombre.length).toBeGreaterThan(0);
        expect(estilo.ayuda.length).toBeGreaterThan(0);
      }
    }
  });

  it("Halloween y la Canción Criolla son alternativas entre sí, y nadie más lo es", () => {
    expect(alternativaDe("halloween")).toBe("cancion-criolla");
    expect(alternativaDe("cancion-criolla")).toBe("halloween");
    expect(alternativaDe("navidad")).toBeNull();
    expect(alternativaDe("dia-de-la-madre")).toBeNull();
    expect(alternativaDe("san-juan")).toBeNull();
    for (const slug of SLUGS_CON_DISENO) {
      const otra = alternativaDe(slug);
      if (otra) expect(alternativaDe(otra)).toBe(slug);
    }
  });
});
