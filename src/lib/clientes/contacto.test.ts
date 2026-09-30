import { describe, expect, it } from "vitest";

import {
  celularParaLeer,
  enlaceComoLlegar,
  enlaceLlamar,
  enlaceWhatsAppCliente,
  normalizarCelular,
} from "./contacto";

describe("normalizarCelular", () => {
  it("el mismo celular escrito de muchas formas es el mismo", () => {
    for (const escrito of [
      "965111222",
      "965 111 222",
      "965-111-222",
      "+51 965 111 222",
      "51965111222",
      "(51) 965111222",
    ]) {
      expect(normalizarCelular(escrito), escrito).toBe("965111222");
    }
  });

  it("un fijo con código de ciudad se deja como está", () => {
    expect(normalizarCelular("065 231 000")).toBe("065231000");
  });
});

describe("enlaces de contacto", () => {
  it("llamar lleva el prefijo de Perú en un celular", () => {
    expect(enlaceLlamar("965 111 222")).toBe("tel:+51965111222");
    expect(enlaceLlamar("065231000")).toBe("tel:065231000");
  });

  it("WhatsApp solo para un celular (9 dígitos que empiezan por 9)", () => {
    expect(enlaceWhatsAppCliente("+51 965 111 222")).toBe("https://wa.me/51965111222");
    expect(enlaceWhatsAppCliente("065231000")).toBeNull();
  });

  it("cómo llegar solo con punto en el mapa", () => {
    expect(enlaceComoLlegar(-3.7437, -73.2516)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-3.7437,-73.2516",
    );
    expect(enlaceComoLlegar(null, -73.25)).toBeNull();
  });

  it("para leerlo en voz alta, de tres en tres", () => {
    expect(celularParaLeer("965111222")).toBe("965 111 222");
  });
});
