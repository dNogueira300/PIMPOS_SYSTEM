import { describe, expect, it } from "vitest";

import { hoyEnLima, leerPeriodo, sumarDias } from "./periodo";

// 12/10/2026 a las 02:00 en UTC son las 21:00 del 11/10 en Iquitos.
const AHORA = new Date("2026-10-12T02:00:00.000Z");

describe("hoyEnLima", () => {
  it("es el día de Iquitos, no el de UTC", () => {
    expect(hoyEnLima(AHORA)).toBe("2026-10-11");
  });
});

describe("sumarDias", () => {
  it("cruza meses", () => {
    expect(sumarDias("2026-10-01", -1)).toBe("2026-09-30");
    expect(sumarDias("2026-10-11", -29)).toBe("2026-09-12");
  });
});

describe("leerPeriodo", () => {
  it("sin parámetros, los últimos N días hasta hoy", () => {
    expect(leerPeriodo({}, AHORA, 30)).toEqual({ desde: "2026-09-12", hasta: "2026-10-11" });
  });

  it("respeta fechas válidas", () => {
    expect(leerPeriodo({ desde: "2026-10-01", hasta: "2026-10-07" }, AHORA, 30)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-07",
    });
  });

  it("si vienen al revés, las ordena", () => {
    expect(leerPeriodo({ desde: "2026-10-07", hasta: "2026-10-01" }, AHORA, 30)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-07",
    });
  });

  it("ignora lo que no es una fecha", () => {
    expect(leerPeriodo({ desde: "ayer", hasta: ["x"] }, AHORA, 7)).toEqual({
      desde: "2026-10-05",
      hasta: "2026-10-11",
    });
  });
});
