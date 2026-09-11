import { describe, expect, it } from "vitest";

import type { Configuracion } from "@/lib/datos/configuracion";

import {
  horarioSchema,
  panaderiaSchema,
  preguntasSchema,
  rangoDePrecios,
  serializarJsonLd,
} from "./datos-estructurados";

// Lo que se prueba aquí es exactamente lo que lee Google para mostrar el
// horario, la dirección y el teléfono junto al nombre de la panadería. Un error
// no rompe la página: la hace desaparecer de la ficha del buscador, en silencio.

const DOS_TURNOS = [
  { desde: "04:00", hasta: "13:00" },
  { desde: "16:00", hasta: "21:00" },
];

function config(parcial: Partial<Configuracion> = {}): Configuracion {
  return {
    nombre_comercial: "Panadería Pimpo's",
    razon_social: "",
    eslogan: "",
    logo_url: "/marca/logo.webp",
    logo_alt: "Panadería Pimpo's",
    isotipo_url: "/marca/isotipo.svg",
    favicon_url: "/marca/favicon.svg",
    telefono: "065 987654",
    whatsapp: "51947874820",
    correo: "contactopimpos@gmail.com",
    facebook: "",
    instagram: "",
    direccion: "Calle Elías Aguirre 1321",
    referencia: "",
    distrito: "Belén",
    provincia: "Maynas",
    departamento: "Loreto",
    coordenadas: { lat: -3.7595, lng: -73.2516 },
    horario_semanal: {
      lunes: DOS_TURNOS,
      martes: DOS_TURNOS,
      miercoles: DOS_TURNOS,
      jueves: DOS_TURNOS,
      viernes: DOS_TURNOS,
      sabado: DOS_TURNOS,
      domingo: [],
    },
    nota_horarios: "",
    historia: "",
    mision: "",
    vision: "",
    valores: [],
    delivery_zonas: [],
    delivery_costo: null,
    pedido_minimo: null,
    delivery_tiempo: "",
    formas_pago: [],
    ...parcial,
  };
}

describe("horarioSchema", () => {
  it("agrupa los dias que comparten turno en vez de repetirlos", () => {
    // Lunes a sabado con los mismos dos turnos: dos entradas, no doce.
    const horario = horarioSchema(config().horario_semanal);
    expect(horario).toHaveLength(2);
    expect(horario[0]).toMatchObject({ opens: "04:00", closes: "13:00" });
    expect(horario[1]).toMatchObject({ opens: "16:00", closes: "21:00" });
    expect(horario[0].dayOfWeek).toHaveLength(6);
  });

  it("el domingo no aparece, que en schema.org significa cerrado", () => {
    // Publicarlo con horas vacias le diria al buscador que abre.
    const dias = horarioSchema(config().horario_semanal).flatMap((h) => h.dayOfWeek);
    expect(dias).not.toContain("https://schema.org/Sunday");
    expect(dias).toContain("https://schema.org/Saturday");
  });

  it("un dia con horario distinto sale en su propia entrada", () => {
    const horario = horarioSchema({
      lunes: DOS_TURNOS,
      sabado: [{ desde: "05:00", hasta: "12:00" }],
    });
    expect(horario).toHaveLength(3);
    expect(horario.find((h) => h.opens === "05:00")?.dayOfWeek).toEqual([
      "https://schema.org/Saturday",
    ]);
  });

  it("ignora una clave de dia mal escrita en vez de publicarla", () => {
    // El horario lo edita una persona. "Lunes" con mayuscula no es "lunes".
    const horario = horarioSchema({ Lunes: DOS_TURNOS, martes: DOS_TURNOS });
    expect(horario.flatMap((h) => h.dayOfWeek)).toEqual([
      "https://schema.org/Tuesday",
      "https://schema.org/Tuesday",
    ]);
  });
});

describe("rangoDePrecios", () => {
  it("va del pan mas barato al producto mas caro", () => {
    expect(rangoDePrecios([0.1, 2, null, 25.5])).toBe("S/ 0.10 - S/ 25.50");
  });

  it("con un solo precio no inventa un rango", () => {
    expect(rangoDePrecios([0.1, 0.1])).toBe("S/ 0.10");
  });

  it("sin precios, null: mejor no decir nada que decir S/ 0.00", () => {
    expect(rangoDePrecios([null, null])).toBeNull();
    expect(rangoDePrecios([])).toBeNull();
  });
});

describe("panaderiaSchema", () => {
  const base = {
    urlSitio: "https://panaderiapimpos.com",
    urlLogo: "https://panaderiapimpos.com/marca/logo.png",
    precios: [0.1, 2],
  };

  it("es una panaderia con direccion, coordenadas y horario", () => {
    const datos = panaderiaSchema({ config: config(), ...base });
    expect(datos["@type"]).toBe("Bakery");
    expect(datos.address).toMatchObject({
      streetAddress: "Calle Elías Aguirre 1321, Belén",
      addressLocality: "Iquitos",
      addressRegion: "Loreto",
      addressCountry: "PE",
    });
    expect(datos.geo).toMatchObject({ latitude: -3.7595, longitude: -73.2516 });
    expect(datos.openingHoursSpecification).toHaveLength(2);
    expect(datos.priceRange).toBe("S/ 0.10 - S/ 2.00");
  });

  it("no publica redes vacias", () => {
    // Facebook e Instagram estan vacios en la ficha. Un `sameAs` a ninguna
    // parte es ruido para el buscador.
    const datos = panaderiaSchema({ config: config(), ...base });
    expect(datos).not.toHaveProperty("sameAs");

    const conRedes = panaderiaSchema({
      config: config({ facebook: "https://facebook.com/pimpos" }),
      ...base,
    });
    expect(conRedes.sameAs).toEqual(["https://facebook.com/pimpos"]);
  });

  it("sin coordenadas ni telefono, omite esos campos en vez de dejarlos vacios", () => {
    const datos = panaderiaSchema({
      config: config({ coordenadas: null, telefono: "" }),
      ...base,
    });
    expect(datos).not.toHaveProperty("geo");
    expect(datos).not.toHaveProperty("telephone");
  });
});

describe("preguntasSchema", () => {
  it("convierte cada pregunta en Question con su respuesta", () => {
    const datos = preguntasSchema([{ pregunta: "¿Hacen delivery?", respuesta: "Sí." }]);
    expect(datos["@type"]).toBe("FAQPage");
    expect(datos.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "¿Hacen delivery?",
      acceptedAnswer: { "@type": "Answer", text: "Sí." },
    });
  });
});

describe("serializarJsonLd", () => {
  it("un texto del panel no puede cerrar la etiqueta script", () => {
    // Estos textos los escribe una persona. Sin el escape, una respuesta con
    // `</script>` cerraria la etiqueta y lo que viniera detras se ejecutaria en
    // el navegador de cada visitante.
    const salida = serializarJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(salida).not.toContain("<");
    expect(salida).toContain("\\u003c/script>");
  });

  it("sigue siendo JSON valido con el mismo contenido", () => {
    const original = { text: "Pan <caliente> a S/ 0.10" };
    expect(JSON.parse(serializarJsonLd(original))).toEqual(original);
  });
});
