import "server-only";

import type { TablaExportable } from "@/lib/insumos/formato-reporte";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { exigirAcceso } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { generarSlug } from "@/lib/utilidades/slug";

import { NOMBRE_BORRADO } from "./borrado";
import { leerTodas } from "./paginas";
import { clientesATabla } from "./tabla";

const TIPO = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

/**
 * «Descargar Excel» y «Descargar PDF» de la lista de clientes: solo la
 * administración (roles.ts y la política de `exportaciones_clientes`), con la
 * zona y el estado de la pantalla. Primero se registra; si el registro falla,
 * no sale el archivo: una copia de datos personales sin constancia es justo lo
 * que la decisión 6 quiere evitar.
 */
export async function descargarClientes(
  peticion: Request,
  extension: keyof typeof TIPO,
  convertir: (tabla: TablaExportable) => Promise<Buffer>,
): Promise<Response> {
  await exigirAcceso(`/admin/clientes/${extension === "xlsx" ? "excel" : "pdf"}`);
  const parametros = new URL(peticion.url).searchParams;
  const zonaId = parametros.get("zona") || null;
  const desactivados = parametros.get("estado") === "desactivados";

  const supabase = await crearClienteServidor();
  const { data: zona } = zonaId
    ? await supabase.from("zonas_reparto").select("nombre").eq("id", zonaId).maybeSingle()
    : { data: null };

  // Por páginas: PostgREST no devuelve más de 1000 filas por petición, y «Todas
  // las zonas» se cortaba ahí sin avisar (revisión de T6).
  const { data, error } = await leerTodas((desde, hasta) => {
    let consulta = supabase
      .from("clientes")
      .select(
        "id, nombre_completo, celular, direccion, referencia, latitud, activo, zonas_reparto(nombre)",
      )
      .is("deleted_at", null)
      .eq("activo", !desactivados)
      .order("nombre_completo")
      .order("id");
    if (zonaId) consulta = consulta.eq("zona_id", zonaId);
    return consulta.range(desde, hasta);
  });
  if (error || !data)
    return new Response("No se pudo preparar la lista. Inténtalo otra vez.", { status: 500 });

  // Los de datos borrados a pedido no salen nunca: ya no son de nadie.
  const filas = data
    .filter((c) => c.nombre_completo !== NOMBRE_BORRADO)
    .map((c) => ({
      nombre_completo: c.nombre_completo,
      celular: c.celular,
      direccion: c.direccion,
      referencia: c.referencia,
      zona: c.zonas_reparto?.nombre ?? null,
      con_punto: c.latitud !== null,
      activo: c.activo,
    }));

  const { error: errorRegistro } = await supabase.from("exportaciones_clientes").insert({
    formato: extension,
    cantidad: filas.length,
    filtro: { zona: zona?.nombre ?? null, estado: desactivados ? "desactivados" : "activos" },
  });
  if (errorRegistro) {
    console.error("[clientes] exportación sin registrar:", errorRegistro.message);
    return new Response(
      "No se pudo registrar la descarga, así que no se descargó nada. Inténtalo otra vez.",
      {
        status: 500,
      },
    );
  }

  const dia = hoyEnLima(new Date());
  const fecha = dia.split("-").reverse().join("/");
  const subtitulo = `${zona?.nombre ?? "Todas las zonas"} · ${desactivados ? "desactivados" : "activos"} · al ${fecha}`;
  const archivo = await convertir(clientesATabla(filas, subtitulo));
  const nombre = `pimpos-clientes-${zona ? generarSlug(zona.nombre) : "todas"}-${dia}.${extension}`;

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": TIPO[extension],
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
