import { descargarReporte } from "@/lib/insumos/descargar-reporte";
import { reporteAPdf } from "@/lib/insumos/exportar-pdf";

export async function GET(
  peticion: Request,
  ctx: RouteContext<"/admin/insumos/reportes/[reporte]/pdf">,
) {
  const { reporte } = await ctx.params;
  return descargarReporte(peticion, reporte, "pdf", reporteAPdf);
}
