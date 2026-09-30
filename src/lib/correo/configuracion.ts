export type ConfiguracionCorreo =
  | { activo: false; motivo: string }
  | { activo: true; apiKey: string; destinatarios: string[]; remitente: string };

/**
 * El correo está encendido solo si hay llave Y destinatarios. Sin dominio
 * verificado, Resend solo entrega a la cuenta dueña: hasta entonces se deja sin
 * `RESEND_API_KEY` y todo sigue funcionando sin mandar nada.
 */
export function leerConfiguracionCorreo(
  entorno: Record<string, string | undefined>,
): ConfiguracionCorreo {
  const apiKey = entorno.RESEND_API_KEY?.trim();
  if (!apiKey) return { activo: false, motivo: "Falta RESEND_API_KEY" };
  const destinatarios = (entorno.CORREO_ALERTAS ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (destinatarios.length === 0) return { activo: false, motivo: "Falta CORREO_ALERTAS" };
  return {
    activo: true,
    apiKey,
    destinatarios,
    remitente: entorno.CORREO_REMITENTE?.trim() || "Panadería Pimpo's <onboarding@resend.dev>",
  };
}
