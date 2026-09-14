import { describe, expect, it } from "vitest";

import { mensajeArmado } from "./pedido-armado";

describe("mensajeArmado", () => {
  it("compone el pedido con los datos que dio el cliente", () => {
    expect(
      mensajeArmado({
        nombre: "Mariana",
        zona: "Belén",
        hora: "7:00 a. m.",
        productos: "10 panes franceses",
      }),
    ).toBe(
      "Hola, quiero hacer un pedido.\n\nNombre: Mariana\nZona: Belén\nHora de entrega: 7:00 a. m.\n\nPedido:\n10 panes franceses",
    );
  });

  // Solo el pedido es obligatorio: lo demás se omite si viene vacío, en vez de
  // mandar "Nombre: " sin nada detrás.
  it("omite lo que viene vacío", () => {
    expect(mensajeArmado({ nombre: "  ", zona: "", hora: "", productos: "2 empanadas" })).toBe(
      "Hola, quiero hacer un pedido.\n\nPedido:\n2 empanadas",
    );
  });

  it("sin pedido no hay mensaje", () => {
    expect(
      mensajeArmado({ nombre: "Mariana", zona: "Belén", hora: "", productos: "   " }),
    ).toBeNull();
  });

  it("respeta los saltos de línea del pedido, sin espacios sobrantes", () => {
    expect(
      mensajeArmado({ nombre: "", zona: "", hora: "", productos: "  10 panes\n2 empanadas  " }),
    ).toBe("Hola, quiero hacer un pedido.\n\nPedido:\n10 panes\n2 empanadas");
  });
});
