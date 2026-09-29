import { describe, expect, it } from "vitest";

import { nombreDeArchivo } from "./nombre-archivo";

describe("nombreDeArchivo", () => {
  it("dice qué reporte y qué periodo, sin espacios ni tildes", () => {
    expect(nombreDeArchivo("consumo", { desde: "2026-10-01", hasta: "2026-10-07" }, "xlsx")).toBe(
      "pimpos-consumo-2026-10-01-al-2026-10-07.xlsx",
    );
  });

  it("sin periodo, solo el reporte", () => {
    expect(nombreDeArchivo("existencias", null, "pdf")).toBe("pimpos-existencias.pdf");
  });
});
