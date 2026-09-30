import { describe, expect, it } from "vitest";

import { esquemaCliente, esquemaCorreccion } from "./cliente";

const ZONA = "0a1f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";
const ID = "1b2f3a52-6b1e-4f7e-9d3a-0a1b2c3d4e5f";

const alta = {
  id: null,
  nombre_completo: "Rosa Quispe",
  celular: "+51 965 111 222",
  direccion: "Jr. Próspero 123",
  referencia: "Portón verde",
  zona_id: ZONA,
  observacion: null,
  ubicacion: null,
  permiso: true,
};

describe("esquemaCliente", () => {
  it("guarda el celular normalizado", () => {
    const r = esquemaCliente.safeParse(alta);
    expect(r.success && r.data.celular).toBe("965111222");
  });

  it("un alta sin permiso no pasa, y lo dice en la casilla (decisión 5)", () => {
    const r = esquemaCliente.safeParse({ ...alta, permiso: false });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["permiso"]);
  });

  it("editar no vuelve a pedir el permiso", () => {
    expect(esquemaCliente.safeParse({ ...alta, id: ID, permiso: false }).success).toBe(true);
  });

  it("el punto en el mapa es opcional (decisión 1), pero si viene tiene que ser un punto", () => {
    expect(
      esquemaCliente.safeParse({ ...alta, ubicacion: { lat: -3.75, lng: -73.25 } }).success,
    ).toBe(true);
    expect(esquemaCliente.safeParse({ ...alta, ubicacion: { lat: 200, lng: 0 } }).success).toBe(
      false,
    );
  });

  it("referencia y zona son obligatorias (ficha 8.2)", () => {
    expect(esquemaCliente.safeParse({ ...alta, referencia: "" }).success).toBe(false);
    expect(esquemaCliente.safeParse({ ...alta, zona_id: "" }).success).toBe(false);
  });

  it("un celular con letras no pasa", () => {
    expect(esquemaCliente.safeParse({ ...alta, celular: "no tiene" }).success).toBe(false);
  });
});

describe("esquemaCorreccion", () => {
  it("el repartidor corrige referencia y punto; nada más", () => {
    const r = esquemaCorreccion.safeParse({
      id: ID,
      referencia: "Portón azul",
      ubicacion: null,
      nombre_completo: "Otro nombre",
    });
    expect(r.success).toBe(true);
    expect(r.success && "nombre_completo" in r.data).toBe(false);
  });
});
