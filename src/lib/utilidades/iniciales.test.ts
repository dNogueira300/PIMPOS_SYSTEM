import { describe, expect, it } from "vitest";

import { iniciales } from "./iniciales";

describe("iniciales", () => {
  it("toma la primera letra del primer y el último nombre", () => {
    expect(iniciales("María Luisa Pérez")).toBe("MP");
    expect(iniciales("Jorge Tuesta")).toBe("JT");
  });

  it("con un solo nombre, una sola letra", () => {
    expect(iniciales("Rosa")).toBe("R");
  });

  it("conserva las tildes y la eñe, en mayúscula", () => {
    expect(iniciales("ángel ñaupari")).toBe("ÁÑ");
  });

  it("no se deja engañar por espacios de más ni por puntos", () => {
    expect(iniciales("  Doña   Carmen  ")).toBe("DC");
    expect(iniciales("C. Ríos")).toBe("CR");
  });

  it("sin nombre, cadena vacía en vez de un hueco raro", () => {
    expect(iniciales("   ")).toBe("");
  });
});
