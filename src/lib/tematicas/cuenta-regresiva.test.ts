import { describe, expect, it } from "vitest";

import { hoyEnLima } from "@/lib/insumos/periodo";

import { textoCuentaRegresiva } from "./cuenta-regresiva";

describe("textoCuentaRegresiva", () => {
  it("cuenta los días que faltan", () => {
    expect(textoCuentaRegresiva("2026-12-25", "2026-12-13", "Navidad")).toBe(
      "Faltan 12 días para Navidad",
    );
  });

  it("en singular cuando falta uno", () => {
    expect(textoCuentaRegresiva("2026-12-25", "2026-12-24", "Navidad")).toBe(
      "Falta 1 día para Navidad",
    );
  });

  it("el mismo día lo celebra", () => {
    expect(textoCuentaRegresiva("2026-12-25", "2026-12-25", "Navidad")).toBe("¡Hoy es Navidad!");
  });

  it("pasada la fiesta no dice nada", () => {
    expect(textoCuentaRegresiva("2026-12-25", "2026-12-26", "Navidad")).toBeNull();
  });

  it("cruza el cambio de mes y de año", () => {
    expect(textoCuentaRegresiva("2027-01-06", "2026-12-30", "Reyes")).toBe(
      "Faltan 7 días para Reyes",
    );
  });

  it("la medianoche UTC no adelanta el día de Iquitos", () => {
    // 03:00 UTC del 25 son las 22:00 del 24 en Iquitos: todavía falta un día.
    const hoy = hoyEnLima(new Date("2026-12-25T03:00:00.000Z"));
    expect(textoCuentaRegresiva("2026-12-25", hoy, "Navidad")).toBe("Falta 1 día para Navidad");
  });

  it("una fecha rota no dice nada", () => {
    expect(textoCuentaRegresiva("no-es-fecha", "2026-12-13", "Navidad")).toBeNull();
  });
});
