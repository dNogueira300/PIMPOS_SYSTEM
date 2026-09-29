import { createHash, timingSafeEqual } from "node:crypto";

import { enviarCorreo } from "@/lib/correo/enviar";
import { armarResumen, avisosVigentes } from "@/lib/correo/resumen";
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
 * Lo llama el cron de Vercel una vez al día, entre las 12:00 y las 12:59 UTC
 * (07:00–07:59 en Iquitos): en el plan Hobby Vercel solo garantiza la hora, no
 * el minuto, y así corre siempre después de que `pg_cron` evalúe las alertas a
 * las 11:10 UTC (0015). Si producción pasa a Cloudflare, lo llama un Cron
 * Trigger con la misma cabecera: la ruta no depende del hosting.
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
    .select("tipo, titulo, mensaje, insumo_id, lote_id, created_at")
    .is("enviada_en", null)
    .is("resuelta_en", null)
    .order("created_at");
  if (error) {
    console.error("[avisos] no se pudieron leer:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  const ultimo = avisos.at(-1);
  if (!ultimo) return Response.json({ enviados: 0 });

  // Mientras el correo estuvo apagado se acumula un aviso por insumo y día:
  // sale solo el más reciente de cada uno.
  const vigentes = avisosVigentes(avisos);
  const ahora = new Date().toISOString();
  const resultado = await enviarCorreo(
    armarResumen(vigentes, formatearFechaLima(ahora).slice(0, 10)),
  );
  // Solo se marcan si salieron: apagado, se quedan para el día que se encienda.
  // Se marcan TODOS los leídos (también los repetidos que no salieron) y con un
  // filtro, no con la lista de ids: tras semanas apagado serían cientos de ids
  // en la URL, y si la marca fallara el mismo correo saldría cada mañana.
  if (resultado.enviado) {
    const { error: errorMarca } = await supabase
      .from("notificaciones")
      .update({ enviada_en: ahora })
      .is("enviada_en", null)
      .is("resuelta_en", null)
      .lte("created_at", ultimo.created_at);
    if (errorMarca) console.error("[avisos] enviados pero sin marcar:", errorMarca.message);
  }
  return Response.json({
    enviados: resultado.enviado ? vigentes.length : 0,
    motivo: resultado.motivo,
  });
}
