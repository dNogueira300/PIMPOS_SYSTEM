import { describe, expect, it } from "vitest";

import { nombreConDe, nombreEnFrase } from "./nombre";

describe("el nombre de la fiesta dentro de una frase", () => {
  it("con su artículo cuando lo lleva", () => {
    expect(nombreEnFrase("dia-de-la-madre", "Día de la Madre")).toBe("el Día de la Madre");
    expect(nombreConDe("dia-de-la-madre", "Día de la Madre")).toBe("del Día de la Madre");
  });

  it("sin artículo cuando no lo lleva", () => {
    expect(nombreEnFrase("navidad", "Navidad")).toBe("Navidad");
    expect(nombreConDe("navidad", "Navidad")).toBe("de Navidad");
  });

  it("una temática sin diseño usa su nombre tal cual", () => {
    expect(nombreEnFrase("san-juan", "San Juan")).toBe("San Juan");
    expect(nombreConDe("san-juan", "San Juan")).toBe("de San Juan");
  });
});
