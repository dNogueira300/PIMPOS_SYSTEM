import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` lanza fuera de un Server Component; aquí solo estorba.
vi.mock("server-only", () => ({}));

const enviar = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: enviar };
  },
}));

const { enviarCorreo } = await import("./enviar");

const correo = { asunto: "Pimpo's: prueba", texto: "Hola", html: "<p>Hola</p>" };

describe("enviarCorreo", () => {
  beforeEach(() => {
    enviar.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("apagado, no llama a Resend y dice por qué", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CORREO_ALERTAS", "a@b.pe");
    expect(await enviarCorreo(correo)).toEqual({ enviado: false, motivo: "Falta RESEND_API_KEY" });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("encendido, manda a todos los destinatarios con el remitente configurado", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("CORREO_ALERTAS", "a@b.pe, c@d.pe");
    vi.stubEnv("CORREO_REMITENTE", "");
    enviar.mockResolvedValue({ data: { id: "1" }, error: null });
    expect(await enviarCorreo(correo)).toEqual({ enviado: true });
    expect(enviar).toHaveBeenCalledWith({
      from: "Panadería Pimpo's <onboarding@resend.dev>",
      to: ["a@b.pe", "c@d.pe"],
      subject: "Pimpo's: prueba",
      text: "Hola",
      html: "<p>Hola</p>",
    });
  });

  it("si Resend lo rechaza, devuelve su mensaje en vez de dar por enviado", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("CORREO_ALERTAS", "a@b.pe");
    enviar.mockResolvedValue({ data: null, error: { message: "Dominio no verificado" } });
    expect(await enviarCorreo(correo)).toEqual({
      enviado: false,
      motivo: "Dominio no verificado",
    });
  });

  it("nunca lanza, aunque la red falle", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("CORREO_ALERTAS", "a@b.pe");
    enviar.mockRejectedValue(new Error("sin red"));
    expect(await enviarCorreo(correo)).toEqual({ enviado: false, motivo: "sin red" });
  });
});
