import { describe, expect, it } from "vitest";

import { avisoSoloTemporada, describirEstado, type EstadoTematica } from "./estado";

const navidad = (cambios: Partial<EstadoTematica> = {}): EstadoTematica => ({
  activa: false,
  encendido_vigente: "fechas",
  inicio: "2026-12-01",
  fin: "2026-12-26",
  encendido_hasta: null,
  ...cambios,
});

describe("describirEstado", () => {
  it("activa por fechas dice hasta cuándo", () => {
    expect(describirEstado(navidad({ activa: true }), "2026-12-10")).toBe(
      "Activa ahora, hasta el 26/12",
    );
  });

  it("encendida o apagada a mano dice hasta cuándo vale lo manual", () => {
    expect(
      describirEstado(
        navidad({ activa: true, encendido_vigente: "encendida", encendido_hasta: "2026-12-26" }),
        "2026-11-20",
      ),
    ).toBe("Encendida a mano hasta el 26/12");
    expect(
      describirEstado(
        navidad({ encendido_vigente: "apagada", encendido_hasta: "2026-12-26" }),
        "2026-12-05",
      ),
    ).toBe("Apagada a mano hasta el 26/12");
  });

  it("antes de sus fechas dice cuándo se enciende sola", () => {
    expect(describirEstado(navidad(), "2026-11-20")).toBe("Se enciende sola el 01/12");
  });

  it("con las fechas pasadas pide poner las del próximo año", () => {
    expect(describirEstado(navidad(), "2026-12-27")).toBe(
      "Las fechas ya pasaron: pon las del próximo año",
    );
  });

  it("el día de inicio y el de fin cuentan como dentro de sus fechas", () => {
    expect(describirEstado(navidad({ activa: true }), "2026-12-01")).toBe(
      "Activa ahora, hasta el 26/12",
    );
    expect(describirEstado(navidad({ activa: true }), "2026-12-26")).toBe(
      "Activa ahora, hasta el 26/12",
    );
  });
});

describe("avisoSoloTemporada", () => {
  it("sin temáticas que lo vendan en exclusiva, no hay aviso", () => {
    expect(avisoSoloTemporada([])).toBeNull();
  });

  it("dice en qué temporada se vende y si hoy se ve", () => {
    expect(avisoSoloTemporada([{ nombre: "Navidad", activa: false }])).toBe(
      "Solo se vende en Navidad · ahora no se ve en el sitio",
    );
    expect(avisoSoloTemporada([{ nombre: "Navidad", activa: true }])).toBe(
      "Solo se vende en Navidad · hoy se ve en el sitio",
    );
  });

  it("con dos temáticas, basta una activa para que se vea", () => {
    expect(
      avisoSoloTemporada([
        { nombre: "Navidad", activa: false },
        { nombre: "Año Nuevo", activa: true },
      ]),
    ).toBe("Solo se vende en Navidad y Año Nuevo · hoy se ve en el sitio");
  });
});
