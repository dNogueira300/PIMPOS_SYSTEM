import { describe, expect, it } from "vitest";

import { clientesATabla } from "./tabla";

const rosa = {
  nombre_completo: "Rosa Quispe",
  celular: "965111222",
  direccion: "Jr. Próspero 123",
  referencia: "Portón verde",
  zona: "Belén",
  con_punto: true,
  activo: true,
};

describe("clientesATabla", () => {
  it("una fila por cliente, con el celular para leer y sin fotos (decisión 6)", () => {
    const t = clientesATabla([rosa], "Belén · activos · al 01/10/2026");
    expect(t.columnas.map((c) => c.titulo)).toEqual([
      "Cliente",
      "Celular",
      "Dirección",
      "Referencia",
      "Zona",
      "Punto en el mapa",
    ]);
    expect(t.filas[0]).toMatchObject({ celular: "965 111 222", punto: "Sí" });
    expect(JSON.stringify(t)).not.toMatch(/foto|clientes\//i);
  });

  it("todo es texto: sin total ni marca de costo", () => {
    const t = clientesATabla([rosa, { ...rosa, con_punto: false, zona: null }], "x");
    expect(t.columnas.every((c) => c.tipo === "texto")).toBe(true);
    expect(t.total).toBeNull();
    expect(t.sinCosto).toEqual([false, false]);
    expect(t.hayCostosDesconocidos).toBe(false);
    expect(t.filas[1]).toMatchObject({ zona: "Sin zona", punto: "No" });
  });

  it("sin clientes lo dice con sus palabras", () => {
    expect(clientesATabla([], "x").vacio).toBe("No hay clientes con ese filtro.");
  });
});
