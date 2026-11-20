import { describe, expect, it } from "vitest";

import { avisoDeAlternativa, nombreConDe, nombreEnFrase } from "./nombre";

describe("el nombre de la fiesta dentro de una frase", () => {
  it("con su artículo cuando lo lleva", () => {
    expect(nombreEnFrase("dia-de-la-madre", "Día de la Madre")).toBe("el Día de la Madre");
    expect(nombreConDe("dia-de-la-madre", "Día de la Madre")).toBe("del Día de la Madre");
    expect(nombreEnFrase("cancion-criolla", "Día de la Canción Criolla")).toBe(
      "el Día de la Canción Criolla",
    );
    expect(nombreConDe("cancion-criolla", "Día de la Canción Criolla")).toBe(
      "del Día de la Canción Criolla",
    );
  });

  it("sin artículo cuando no lo lleva", () => {
    expect(nombreEnFrase("navidad", "Navidad")).toBe("Navidad");
    expect(nombreConDe("navidad", "Navidad")).toBe("de Navidad");
    expect(nombreEnFrase("halloween", "Halloween")).toBe("Halloween");
    expect(nombreConDe("halloween", "Halloween")).toBe("de Halloween");
  });

  it("una temática sin diseño usa su nombre tal cual", () => {
    expect(nombreEnFrase("san-juan", "San Juan")).toBe("San Juan");
    expect(nombreConDe("san-juan", "San Juan")).toBe("de San Juan");
  });
});

describe("el aviso de dos temáticas alternativas", () => {
  it("nombra las dos, con su artículo y la mayúscula al empezar", () => {
    expect(
      avisoDeAlternativa("halloween", "Halloween", "cancion-criolla", "Día de la Canción Criolla"),
    ).toBe(
      "Halloween y el Día de la Canción Criolla son para la misma fiesta: solo una puede estar " +
        "encendida. La otra déjala «Apagada»: seguirá apagada aunque le cambies las fechas, hasta el " +
        "día que termina. Cada año, al poner las fechas nuevas, vuelve a elegir «Apagada».",
    );
    expect(
      avisoDeAlternativa("cancion-criolla", "Día de la Canción Criolla", "halloween", "Halloween"),
    ).toBe(
      "El Día de la Canción Criolla y Halloween son para la misma fiesta: solo una puede estar " +
        "encendida. La otra déjala «Apagada»: seguirá apagada aunque le cambies las fechas, hasta el " +
        "día que termina. Cada año, al poner las fechas nuevas, vuelve a elegir «Apagada».",
    );
  });
});
