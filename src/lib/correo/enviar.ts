import "server-only";

import { Resend } from "resend";

import { leerConfiguracionCorreo } from "./configuracion";

/**
 * Manda un correo a CORREO_ALERTAS. NUNCA lanza: un correo que no sale no puede
 * deshacer una baja ya pedida ni tumbar el resumen. Lo que pasó queda en el
 * registro del servidor, con el mensaje de Resend entero (trampa de AGENTS.md:
 * una comprobación que solo dice «falló» cuesta más de lo que ahorra).
 */
export async function enviarCorreo(correo: {
  asunto: string;
  texto: string;
  html: string;
}): Promise<{ enviado: boolean; motivo?: string }> {
  const configuracion = leerConfiguracionCorreo(process.env);
  if (!configuracion.activo) {
    console.info(`[correo] apagado (${configuracion.motivo}): «${correo.asunto}»`);
    return { enviado: false, motivo: configuracion.motivo };
  }
  try {
    const resend = new Resend(configuracion.apiKey);
    const { error } = await resend.emails.send({
      from: configuracion.remitente,
      to: configuracion.destinatarios,
      subject: correo.asunto,
      text: correo.texto,
      html: correo.html,
    });
    if (error) {
      console.error(`[correo] Resend rechazó «${correo.asunto}»:`, JSON.stringify(error));
      return { enviado: false, motivo: error.message };
    }
    return { enviado: true };
  } catch (e) {
    console.error(`[correo] no se pudo enviar «${correo.asunto}»:`, e);
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}
