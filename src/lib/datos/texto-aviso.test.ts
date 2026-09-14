import { describe, expect, it } from "vitest";

import { textoDelAviso } from "./texto-aviso";

// La barra de aviso de arriba del todo (prototipo de Stitch, plan 03.1). El
// prototipo decía "Horneamos desde las 4:00 AM · Envíos a todo Iquitos": aquí
// se arma con la hora y las zonas que hay en la base, para que no pueda
// contradecir al horario ni al reparto.

describe("textoDelAviso", () => {
  it("dice la hora de apertura y las zonas de reparto", () => {
    expect(textoDelAviso({ abreALas: "4:00 a. m.", zonas: "Iquitos, Belén y Punchana" })).toBe(
      "Abrimos a las 4:00 a. m. · Delivery a Iquitos, Belén y Punchana",
    );
  });

  it("sin zonas, solo la hora", () => {
    expect(textoDelAviso({ abreALas: "4:00 a. m.", zonas: "" })).toBe("Abrimos a las 4:00 a. m.");
  });

  it("sin horario, solo el reparto", () => {
    expect(textoDelAviso({ abreALas: null, zonas: "Iquitos" })).toBe("Delivery a Iquitos");
  });

  // Sin ningún dato no hay barra: una franja de color vacía o con un texto
  // genérico es peor que no tenerla.
  it("sin ningún dato, no hay aviso", () => {
    expect(textoDelAviso({ abreALas: null, zonas: "" })).toBeNull();
  });

  it("unas zonas en blanco cuentan como ninguna", () => {
    expect(textoDelAviso({ abreALas: null, zonas: "   " })).toBeNull();
  });
});
