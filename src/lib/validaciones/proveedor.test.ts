import { describe, expect, it } from "vitest";

import { esquemaProveedor } from "./proveedor";

describe("esquemaProveedor", () => {
  it("solo el nombre es obligatorio (ficha 7.10)", () => {
    const r = esquemaProveedor.safeParse({
      id: null,
      nombre: "Comercial FOX",
      contacto: null,
      telefono: null,
      observacion: null,
    });
    expect(r.success).toBe(true);
  });

  it("sin nombre, no", () => {
    const r = esquemaProveedor.safeParse({
      id: null,
      nombre: "",
      contacto: null,
      telefono: null,
      observacion: null,
    });
    expect(r.success).toBe(false);
  });
});
