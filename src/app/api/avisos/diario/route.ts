import { createHash, timingSafeEqual } from "node:crypto";

import { enviarCorreo } from "@/lib/correo/enviar";
import { armarResumen } from "@/lib/correo/resumen";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Compara la cabecera con el secreto sin que el tiempo de respuesta delate
 * cuántos caracteres acertó. Se comparan los hash para que los dos lados midan
 * lo mismo, que es lo que exige `timingSafeEqual`.
 */
function autorizado(cabecera: string | null, secreto: string): boolean {
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(cabecera ?? ""), hash(`Bearer ${secreto}`));
}

/**
 * Lo llama el cron de Vercel a las 11:15 UTC (06:15 en Iquitos), cinco minutos
 * después de que `pg_cron` evalúe las alertas (0015). Si producción pasa a
 * Cloudflare, lo llama un Cron Trigger con la misma cabecera: la ruta no
 * depende del hosting.
 *
 * Corre sin sesión, así que usa la service_role; por eso exige CRON_SECRET y
 * no hace nada más que leer avisos y marcarlos.
 */
export async function GET(peticion: Request) {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) {
    return Response.json({ error: "Falta CRON_SECRET en el entorno." }, { status: 503 });
  }
  if (!autorizado(peticion.headers.get("authorization"), secreto)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = crearClienteAdministrador();
  const { data: avisos, error } = await supabase
    .from("notificaciones")
    .select("id, tipo, titulo, mensaje")
    .is("enviada_en", null)
    .is("resuelta_en", null)
    .order("created_at");
  if (error) {
    console.error("[avisos] no se pudieron leer:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (avisos.length === 0) return Response.json({ enviados: 0 });

  const ahora = new Date().toISOString();
  const resultado = await enviarCorreo(
    armarResumen(avisos, formatearFechaLima(ahora).slice(0, 10)),
  );
  // Solo se marcan si salieron: apagado, se quedan para el día que se encienda.
  if (resultado.enviado) {
    const { error: errorMarca } = await supabase
      .from("notificaciones")
      .update({ enviada_en: ahora })
      .in(
        "id",
        avisos.map((a) => a.id),
      );
    if (errorMarca) console.error("[avisos] enviados pero sin marcar:", errorMarca.message);
  }
  return Response.json({
    enviados: resultado.enviado ? avisos.length : 0,
    motivo: resultado.motivo,
  });
}
