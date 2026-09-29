import { descargarReporte } from "@/lib/insumos/descargar-reporte";
import { reporteAExcel } from "@/lib/insumos/exportar-excel";

export async function GET(
  peticion: Request,
  ctx: RouteContext<"/admin/insumos/reportes/[reporte]/excel">,
) {
  const { reporte } = await ctx.params;
  return descargarReporte(peticion, reporte, "xlsx", reporteAExcel);
}
