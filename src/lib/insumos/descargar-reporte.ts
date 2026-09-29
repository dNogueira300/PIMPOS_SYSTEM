import "server-only";

import { exigirAcceso } from "@/lib/auth/sesion";

import { nombreDeArchivo } from "./nombre-archivo";
import { hoyEnLima, leerPeriodo } from "./periodo";
import { esSlugReporte, leerReporte, REPORTES, type Reporte } from "./reportes";

const TIPO = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

/**
 * Lo común a «Descargar Excel» y «Descargar PDF»: el mismo acceso que la
 * página del reporte y los mismos datos (`leerReporte`, con el periodo y el
 * insumo de la dirección), convertidos al formato pedido. Cada ruta pasa su
 * conversor para que el Excel no cargue el motor del PDF, ni al revés.
 */
export async function descargarReporte(
  peticion: Request,
  slug: string,
  extension: keyof typeof TIPO,
  convertir: (reporte: Reporte) => Promise<Buffer>,
): Promise<Response> {
  if (!esSlugReporte(slug)) return new Response("Ese reporte no existe.", { status: 404 });
  // Igual que la página: sin sesión redirige a /ingresar, y sin permiso, al inicio del panel.
  await exigirAcceso(`/admin/insumos/reportes/${slug}`);

  const parametros = new URL(peticion.url).searchParams;
  const periodo = leerPeriodo(Object.fromEntries(parametros), new Date(), 30);
  const leido = await leerReporte(slug, periodo, parametros.get("insumo") ?? undefined);
  // Un reporte sin periodo (existencias) es una foto del almacén: en pantalla
  // dice «Hoy», pero un archivo guardado tiene que decir de qué día es.
  const dia = hoyEnLima(new Date());
  const conPeriodo = REPORTES[slug].conPeriodo;
  const reporte = conPeriodo
    ? leido
    : { ...leido, subtitulo: `Al ${dia.split("-").reverse().join("/")}` };
  const archivo = await convertir(reporte);
  const nombre = nombreDeArchivo(slug, conPeriodo ? periodo : dia, extension);

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": TIPO[extension],
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
