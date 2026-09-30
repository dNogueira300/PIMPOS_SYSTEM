import { descargarClientes } from "@/lib/clientes/descargar";
import { reporteAPdf } from "@/lib/insumos/exportar-pdf";

export async function GET(peticion: Request) {
  return descargarClientes(peticion, "pdf", reporteAPdf);
}
