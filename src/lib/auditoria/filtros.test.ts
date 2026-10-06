import { describe, expect, it } from "vitest";

import { leerFiltros, limitesDelPeriodo } from "./filtros";

// 6 de octubre de 2026, 10:00 a. m. en Iquitos.
const AHORA = new Date("2026-10-06T15:00:00.000Z");
const UUID = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

describe("leerFiltros", () => {
  it("sin nada, los últimos 7 días y 50 filas", () => {
    expect(leerFiltros({}, AHORA)).toEqual({
      persona: null,
      seccion: null,
      hizo: null,
      cuando: "7",
      periodo: { desde: "2026-09-30", hasta: "2026-10-06" },
      registro: null,
      ver: 50,
    });
  });

  it("lee lo que viene bien escrito", () => {
    const f = leerFiltros(
      { persona: UUID, seccion: "clientes", hizo: "borro", cuando: "hoy", ver: "100" },
      AHORA,
    );
    expect(f).toMatchObject({
      persona: UUID,
      seccion: "clientes",
      hizo: "borro",
      cuando: "hoy",
      periodo: { desde: "2026-10-06", hasta: "2026-10-06" },
      ver: 100,
    });
    expect(leerFiltros({ persona: "sistema" }, AHORA).persona).toBe("sistema");
  });

  it("lo que viene mal escrito se ignora, sin error (Review Focus)", () => {
    const f = leerFiltros(
      { persona: "abc", seccion: "otra", hizo: "rompio", cuando: "siempre", ver: "999999" },
      AHORA,
    );
    expect(f).toMatchObject({ persona: null, seccion: null, hizo: null, cuando: "7", ver: 500 });
    expect(leerFiltros({ ver: "-3" }, AHORA).ver).toBe(50);
    expect(leerFiltros({ ver: "hola" }, AHORA).ver).toBe(50);
    expect(leerFiltros({ persona: ["a", "b"] }, AHORA).persona).toBeNull();
  });

  it("un rango con fechas válidas se respeta; con una mala, vuelve a los 7 días", () => {
    expect(
      leerFiltros({ cuando: "rango", desde: "2026-09-01", hasta: "2026-09-15" }, AHORA),
    ).toMatchObject({ cuando: "rango", periodo: { desde: "2026-09-01", hasta: "2026-09-15" } });
    expect(
      leerFiltros({ cuando: "rango", desde: "ayer", hasta: "2026-09-15" }, AHORA),
    ).toMatchObject({
      cuando: "7",
    });
  });

  it("«Ver historial» de un registro no pone límite de fechas, salvo que se pida", () => {
    const f = leerFiltros({ registro: UUID, de: "producto" }, AHORA);
    expect(f.registro).toEqual({ id: UUID, de: "producto" });
    expect(f).toMatchObject({ cuando: "todo", periodo: null });
    expect(leerFiltros({ registro: UUID, de: "factura" }, AHORA).registro).toBeNull();
    expect(leerFiltros({ registro: "abc", de: "producto" }, AHORA).registro).toBeNull();
    expect(leerFiltros({ registro: UUID, de: "cliente", cuando: "30" }, AHORA).cuando).toBe("30");
  });
});

describe("limitesDelPeriodo", () => {
  it("un día de Iquitos va de las 05:00 UTC a las 05:00 UTC del siguiente (Review Focus)", () => {
    const { desde, hasta } = limitesDelPeriodo({ desde: "2026-10-05", hasta: "2026-10-05" });
    expect(desde).toBe("2026-10-05T05:00:00.000Z");
    expect(hasta).toBe("2026-10-06T05:00:00.000Z");
    // Las 11:30 p. m. del 5 en Iquitos son las 04:30 UTC del 6: dentro del día 5.
    const cambio = "2026-10-06T04:30:00.000Z";
    expect(cambio >= desde && cambio < hasta).toBe(true);
  });

  it("`de` solo admite los tres dueños, no lo que hereda cualquier objeto", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(leerFiltros({ registro: id, de: "constructor" }, new Date()).registro).toBeNull();
    expect(leerFiltros({ registro: id, de: "toString" }, new Date()).registro).toBeNull();
    expect(leerFiltros({ registro: id, de: "insumo" }, new Date()).registro).toEqual({
      id,
      de: "insumo",
    });
  });
});
