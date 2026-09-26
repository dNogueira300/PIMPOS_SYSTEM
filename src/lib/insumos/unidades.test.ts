import { describe, expect, it } from "vitest";

import {
  describirExistencia,
  formatearCantidad,
  nombreDeUnidad,
  presentacionPrincipal,
} from "./unidades";

describe("nombreDeUnidad", () => {
  it("las métricas van abreviadas y no cambian en plural", () => {
    expect(nombreDeUnidad("kg", 1)).toBe("kg");
    expect(nombreDeUnidad("kg", 62)).toBe("kg");
    expect(nombreDeUnidad("ml", 500)).toBe("ml");
  });

  it("las de conteo se escriben enteras y en plural cuando toca", () => {
    expect(nombreDeUnidad("saco", 1)).toBe("saco");
    expect(nombreDeUnidad("saco", 2)).toBe("sacos");
    expect(nombreDeUnidad("unidad", 1)).toBe("unidad");
    expect(nombreDeUnidad("unidad", 250)).toBe("unidades");
    expect(nombreDeUnidad("rollo", 0)).toBe("rollos");
  });
});

describe("formatearCantidad", () => {
  it("sin ceros de sobra y con dos decimales como mucho", () => {
    expect(formatearCantidad(12.5)).toBe("12.5");
    expect(formatearCantidad(30)).toBe("30");
    expect(formatearCantidad(0.1234)).toBe("0.12");
    expect(formatearCantidad(1500)).toBe("1500");
  });
});

describe("presentacionPrincipal", () => {
  it("es la equivalencia más grande", () => {
    expect(
      presentacionPrincipal([
        { codigo: "g", factor: 0.001 },
        { codigo: "saco", factor: 50 },
      ]),
    ).toEqual({ codigo: "saco", factor: 50 });
  });

  it("sin una equivalencia mayor que 1 no hay presentación que mostrar", () => {
    expect(presentacionPrincipal([{ codigo: "g", factor: 0.001 }])).toBeNull();
    expect(presentacionPrincipal([])).toBeNull();
  });
});

describe("describirExistencia", () => {
  const saco = { codigo: "saco", factor: 50 };

  it("pone la presentación entre paréntesis cuando llega a una entera", () => {
    expect(describirExistencia(62, "kg", saco)).toBe("62 kg (1 saco y 12 kg)");
    expect(describirExistencia(100, "kg", saco)).toBe("100 kg (2 sacos)");
    expect(describirExistencia(250, "unidad", { codigo: "caja", factor: 100 })).toBe(
      "250 unidades (2 cajas y 50 unidades)",
    );
  });

  it("no la pone cuando no llega a una", () => {
    expect(describirExistencia(30, "kg", saco)).toBe("30 kg");
    expect(describirExistencia(0, "kg", saco)).toBe("0 kg");
    expect(describirExistencia(1, "unidad", null)).toBe("1 unidad");
  });

  it("un resto con decimales no se vuelve 49.99999", () => {
    expect(describirExistencia(62.3, "kg", saco)).toBe("62.3 kg (1 saco y 12.3 kg)");
  });
});
