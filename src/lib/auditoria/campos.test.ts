import { describe, expect, it } from "vitest";

import { esDeControl, escribirValor, etiquetaDe, recortar } from "./campos";

describe("campos del historial", () => {
  it("cada campo conocido tiene su nombre en llano", () => {
    expect(etiquetaDe("precio")).toBe("Precio");
    expect(etiquetaDe("nombre_completo")).toBe("Nombre");
    expect(etiquetaDe("stock_minimo")).toBe("Cantidad mínima");
  });

  it("un campo desconocido se dice con su nombre técnico, legible (nunca falla)", () => {
    expect(etiquetaDe("campo_del_futuro")).toBe("Campo del futuro");
  });

  it("los campos de control no son un cambio", () => {
    for (const c of ["id", "created_at", "updated_at", "created_by", "updated_by", "secuencia"]) {
      expect(esDeControl(c), c).toBe(true);
    }
    expect(esDeControl("precio")).toBe(false);
  });

  it("escribe el dinero, el sí o no y lo vacío", () => {
    expect(escribirValor("precio", 0.2, {})).toBe("S/ 0.20");
    expect(escribirValor("costo_total", "125.5", {})).toBe("S/ 125.50");
    expect(escribirValor("activo", true, {})).toBe("Sí");
    expect(escribirValor("destacado", false, {})).toBe("No");
    expect(escribirValor("descripcion", null, {})).toBe("—");
    expect(escribirValor("descripcion", "  ", {})).toBe("—");
  });

  it("escribe las fechas en hora de Iquitos (Review Focus: 04:30 UTC es la noche anterior)", () => {
    expect(escribirValor("aprobada_en", "2026-10-06T04:30:00.000Z", {})).toBe("05/10/2026 23:30");
    expect(escribirValor("fecha_vencimiento", "2026-12-01", {})).toBe("01/12/2026");
  });

  it("escribe los estados, los roles y los tipos con sus palabras", () => {
    expect(escribirValor("estado", "en_revision", {})).toBe("En revisión");
    expect(escribirValor("rol", "ingeniero", {})).toBe("Ingeniero");
    expect(escribirValor("tipo", "ajuste", {})).toBe("Conteo");
    expect(escribirValor("motivo_baja", "vencimiento", {})).toBe("Vencimiento");
  });

  it("un identificador se cambia por el nombre de lo que señala, o dice que ya no existe", () => {
    expect(escribirValor("zona_id", "z1", { z1: "Belén" })).toBe("Belén");
    expect(escribirValor("zona_id", "z9", {})).toBe("algo que ya no existe");
    expect(escribirValor("registrado_por", "u1", { u1: "Marcos" })).toBe("Marcos");
  });

  it("lo que no es texto se escribe legible, no como [object Object] (Review Focus)", () => {
    expect(escribirValor("valor", { lunes: ["04:00", "20:00"], martes: [] }, {})).toBe(
      "lunes: 04:00, 20:00; martes: —",
    );
    expect(escribirValor("valor", [{ titulo: "Calidad", abierto: true }], {})).toBe(
      "titulo: Calidad; abierto: Sí",
    );
    expect(escribirValor("valor", "+51 947 874 820", {})).toBe("+51 947 874 820");
    expect(escribirValor("cantidad", 50, {})).toBe("50");
  });

  it("una persona que ya no está no es «algo»", () => {
    expect(escribirValor("registrado_por", "u9", {})).toBe("alguien que ya no tiene cuenta");
    expect(escribirValor("insumo_id", "i9", {})).toBe("algo que ya no existe");
  });

  it("un punto del mapa se escribe con la precisión con que se corrige", () => {
    expect(escribirValor("latitud", -3.749512, {})).toBe("-3.749512");
    expect(escribirValor("longitud", -73.25, {})).toBe("-73.25");
  });

  it("un costo menor a un céntimo no sale como S/ 0.00", () => {
    expect(escribirValor("costo_unitario", 0.0035, {})).toBe("S/ 0.0035");
    expect(escribirValor("costo_unitario", 4.5, {})).toBe("S/ 4.50");
    expect(escribirValor("precio", 0.2, {})).toBe("S/ 0.20");
  });

  it("los datos técnicos de un movimiento se dicen en llano", () => {
    expect(escribirValor("sentido", 1, {})).toBe("Suma");
    expect(escribirValor("sentido", -1, {})).toBe("Resta");
    expect(escribirValor("moneda", "PEN", {})).toBe("Soles");
    expect(escribirValor("anula_a", "6f2321c8-0000-4000-8000-000000000000", {})).toBe(
      "un movimiento anterior",
    );
  });

  it("recorta lo largo para la lista (Review Focus)", () => {
    expect(recortar("corto", 20)).toBe("corto");
    expect(recortar("x".repeat(100), 20)).toBe(`${"x".repeat(19)}…`);
  });
});
