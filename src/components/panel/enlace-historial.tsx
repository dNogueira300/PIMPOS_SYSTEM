import { History } from "lucide-react";
import Link from "next/link";

import type { Dueno } from "@/lib/auditoria/catalogo";

/**
 * Abre el historial filtrado a un registro, con lo que cuelga de él. Quien lo
 * pinta comprueba antes que la sesión es de la administración: los demás roles
 * no entran a `/admin/auditoria` y el enlace los llevaría a «sin acceso».
 */
export function EnlaceHistorial({ de, id }: { de: Dueno; id: string }) {
  return (
    <Link href={`/admin/auditoria?registro=${id}&de=${de}`} className="boton-linea">
      <History aria-hidden className="size-5" /> Ver historial
    </Link>
  );
}
