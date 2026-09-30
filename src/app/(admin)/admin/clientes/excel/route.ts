import { descargarClientes } from "@/lib/clientes/descargar";
import { reporteAExcel } from "@/lib/insumos/exportar-excel";

export async function GET(peticion: Request) {
  return descargarClientes(peticion, "xlsx", reporteAExcel);
}
