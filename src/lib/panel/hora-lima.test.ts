import { describe, expect, it } from "vitest";

import { limaAUtc, utcALima } from "./hora-lima";

describe("hora de Iquitos (UTC−5, sin horario de verano)", () => {
  it("lo que se escribe en el panel se guarda en UTC", () => {
    expect(limaAUtc("2026-10-01T08:00")).toBe("2026-10-01T13:00:00.000Z");
  });

  it("pasadas las 19:00 en Iquitos ya es otro día en UTC", () => {
    expect(limaAUtc("2026-12-31T21:30")).toBe("2027-01-01T02:30:00.000Z");
  });

  it("lo vacío o mal escrito es null, no una fecha inventada", () => {
    expect(limaAUtc("")).toBeNull();
    expect(limaAUtc("01/10/2026")).toBeNull();
  });

  it("lo guardado vuelve al campo en hora de Iquitos", () => {
    expect(utcALima("2027-01-01T02:30:00+00:00")).toBe("2026-12-31T21:30");
    expect(utcALima(null)).toBe("");
  });
});
