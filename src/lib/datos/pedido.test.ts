import { describe, expect, it } from "vitest";

import { enlaceWhatsApp } from "./configuracion";
import {
  condicionesDelPedido,
  mensajeDePedido,
  numeroParaLeer,
  unirConO,
  unirConY,
} from "./pedido";

// Lo que el cliente lee justo antes de pulsar "Pedir por WhatsApp". Un fallo
// aqui no rompe la pagina: le dice al vecino un precio o un numero que no es.

type DatosDelPedido = Parameters<typeof condicionesDelPedido>[0];

const COMPLETOS: DatosDelPedido = {
  delivery_zonas: ["Iquitos", "Belén", "Punchana", "San Juan Bautista"],
  delivery_costo: 3,
  pedido_minimo: 10,
  delivery_tiempo: "30 a 45 minutos",
  formas_pago: ["Efectivo", "Yape", "Plin"],
};

describe("unirConY y unirConO", () => {
  it("unen una lista como se dice en voz alta", () => {
    expect(unirConY(COMPLETOS.delivery_zonas)).toBe("Iquitos, Belén, Punchana y San Juan Bautista");
    expect(unirConO(COMPLETOS.formas_pago)).toBe("Efectivo, Yape o Plin");
  });

  it("cambian la y por e delante de una i, y la o por u delante de una o", () => {
    // "Belén y Iquitos" es justo el error que delata una frase armada por un
    // programa. `Intl.ListFormat` lo resuelve; esta prueba avisa si algun dia
    // el entorno (un Node sin ICU completo) deja de hacerlo.
    expect(unirConY(["Belén", "Iquitos"])).toBe("Belén e Iquitos");
    expect(unirConO(["Yape", "Otro medio"])).toBe("Yape u Otro medio");
  });

  it("se saltan los huecos que puede dejar el panel", () => {
    expect(unirConY(["Iquitos", " ", "", "Belén"])).toBe("Iquitos y Belén");
    expect(unirConY([])).toBe("");
  });
});

describe("condicionesDelPedido", () => {
  it("dice costo, minimo, tiempo, pago y zonas, en ese orden", () => {
    // Es el orden en que aparece la duda: cuanto me cobran por traerlo, si mi
    // pedido llega al minimo, cuando llega, como pago y si llega a mi zona.
    expect(condicionesDelPedido(COMPLETOS)).toEqual([
      { clave: "costo", etiqueta: "Delivery", valor: "S/ 3.00" },
      { clave: "minimo", etiqueta: "Pedido mínimo", valor: "S/ 10.00" },
      { clave: "tiempo", etiqueta: "Llega en", valor: "30 a 45 minutos" },
      { clave: "pago", etiqueta: "Pagas con", valor: "Efectivo, Yape o Plin" },
      {
        clave: "zonas",
        etiqueta: "Repartimos en",
        valor: "Iquitos, Belén, Punchana y San Juan Bautista",
      },
    ]);
  });

  it("un delivery a cero se anuncia como gratis, y un minimo a cero no se anuncia", () => {
    const condiciones = condicionesDelPedido({ ...COMPLETOS, delivery_costo: 0, pedido_minimo: 0 });

    expect(condiciones.find((c) => c.clave === "costo")?.valor).toBe("Gratis");
    // "Pedido mínimo: S/ 0.00" es ruido, y ademas parece un error.
    expect(condiciones.some((c) => c.clave === "minimo")).toBe(false);
  });

  it("no inventa lo que el negocio no cargo", () => {
    // Sin dato no hay linea. Un "Delivery: S/ NaN" o un "Llega en" colgando
    // son peores que no decir nada.
    expect(
      condicionesDelPedido({
        delivery_zonas: [],
        delivery_costo: null,
        pedido_minimo: null,
        delivery_tiempo: "  ",
        formas_pago: [""],
      }),
    ).toEqual([]);
  });
});

describe("numeroParaLeer", () => {
  it("quita el codigo de pais y agrupa de tres en tres", () => {
    // En la base va como lo exige wa.me. Escrito asi en la pagina,
    // "51947874820" parece un numero equivocado.
    expect(numeroParaLeer("51947874820")).toBe("947 874 820");
    expect(numeroParaLeer("+51 947 874 820")).toBe("947 874 820");
    expect(numeroParaLeer("947874820")).toBe("947 874 820");
  });

  it("un numero que no es un celular peruano se deja entero, con su codigo", () => {
    expect(numeroParaLeer("15551234567")).toBe("+15551234567");
  });

  it("sin numero no hay nada que mostrar", () => {
    expect(numeroParaLeer("")).toBeNull();
    expect(numeroParaLeer("sin numero")).toBeNull();
  });
});

describe("mensajeDePedido", () => {
  it("deja el hueco para la cantidad y la direccion", () => {
    // Son los dos datos sin los que no se despacha un pedido. Antes el mensaje
    // decia solo "quisiera pedir X", y la primera respuesta del negocio era
    // siempre la misma pregunta.
    expect(
      mensajeDePedido({
        nombre: "Arroz",
        variantes: 1,
        varianteNombre: "Kilo",
        varianteUnidad: "kilo",
        presentaciones: [{ id: "a", nombre: "Kilo", precio: 4.5, unidad: "kilo" }],
      }),
    ).toBe("Hola, quisiera pedir Arroz (por kilo).\nCantidad: \nDirección de entrega: ");
  });

  it("no mete «(Unidad)», que se lee como si pidiera un solo pan", () => {
    // Lo marco la critica del 11/09: "quisiera pedir Arvejas (Unidad)" seguido
    // de "Cantidad:" se contradice.
    expect(
      mensajeDePedido({
        nombre: "Arvejas",
        variantes: 1,
        varianteNombre: "Unidad",
        varianteUnidad: "unidad",
        presentaciones: [{ id: "a", nombre: "Unidad", precio: 2, unidad: "unidad" }],
      }),
    ).toMatch(/^Hola, quisiera pedir Arvejas\.\n/);
  });

  it("con varias presentaciones no elige una por el cliente: las escribe todas", () => {
    // La predeterminada no tiene por que ser la que quiere. Antes el mensaje se
    // callaba y el pedido salia sin decir cual, asi que la panaderia tenia que
    // preguntarlo: la pregunta que quitamos de en medio (P2 del 12/09).
    expect(
      mensajeDePedido({
        nombre: "Hamburguesa grande",
        variantes: 2,
        varianteNombre: "De S/ 0.30",
        varianteUnidad: "unidad",
        presentaciones: [
          { id: "a", nombre: "De S/ 0.30", precio: 0.3, unidad: "unidad" },
          { id: "b", nombre: "De S/ 0.40", precio: 0.4, unidad: "unidad" },
        ],
      }),
    ).toBe(
      "Hola, quisiera pedir Hamburguesa grande.\nPresentación (De S/ 0.30 o De S/ 0.40): \nCantidad: \nDirección de entrega: ",
    );
  });

  it("sin producto pregunta que se quiere", () => {
    expect(mensajeDePedido()).toBe(
      "Hola, quisiera hacer un pedido.\nPedido: \nDirección de entrega: ",
    );
  });

  it("los saltos de linea sobreviven al enlace de WhatsApp", () => {
    // Sin codificar, el salto de linea parte la URL y el mensaje llega cortado
    // en la primera linea, sin los huecos.
    const enlace = enlaceWhatsApp({ whatsapp: "51947874820" }, mensajeDePedido());
    expect(enlace).toContain("%0APedido%3A%20%0ADirecci%C3%B3n%20de%20entrega%3A%20");
  });
});
