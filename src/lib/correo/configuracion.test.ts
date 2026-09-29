import { describe, expect, it } from "vitest";

import { leerConfiguracionCorreo } from "./configuracion";

describe("leerConfiguracionCorreo", () => {
  it("apagado sin llave, y lo dice", () => {
    expect(leerConfiguracionCorreo({ CORREO_ALERTAS: "a@b.pe" })).toEqual({
      activo: false,
      motivo: "Falta RESEND_API_KEY",
    });
  });

  it("apagado sin destinatarios", () => {
    expect(leerConfiguracionCorreo({ RESEND_API_KEY: "re_x" })).toEqual({
      activo: false,
      motivo: "Falta CORREO_ALERTAS",
    });
  });

  it("una llave en blanco cuenta como que no hay", () => {
    expect(leerConfiguracionCorreo({ RESEND_API_KEY: "  ", CORREO_ALERTAS: "a@b.pe" })).toEqual({
      activo: false,
      motivo: "Falta RESEND_API_KEY",
    });
  });

  it("encendido con las dos; varios destinatarios separados por coma", () => {
    expect(
      leerConfiguracionCorreo({ RESEND_API_KEY: "re_x", CORREO_ALERTAS: " a@b.pe, c@d.pe, " }),
    ).toEqual({
      activo: true,
      apiKey: "re_x",
      destinatarios: ["a@b.pe", "c@d.pe"],
      remitente: "Panadería Pimpo's <onboarding@resend.dev>",
    });
  });

  it("el remitente se puede cambiar cuando haya dominio", () => {
    const r = leerConfiguracionCorreo({
      RESEND_API_KEY: "re_x",
      CORREO_ALERTAS: "a@b.pe",
      CORREO_REMITENTE: "Pimpo's <avisos@panaderiapimpos.com>",
    });
    expect(r.activo && r.remitente).toBe("Pimpo's <avisos@panaderiapimpos.com>");
  });
});
