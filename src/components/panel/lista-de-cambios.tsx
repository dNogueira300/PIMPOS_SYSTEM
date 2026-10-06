import Link from "next/link";

import { NOMBRE_DEL_ROL, esRol } from "@/lib/auth/roles";
import type { Nombres } from "@/lib/auditoria/catalogo";
import { accion, type Cambio, quien } from "@/lib/auditoria/redactar";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

/** «Ingeniero · 06/10/2026 10:05». Un cambio sin persona es «Automático». */
function pie(c: Cambio): string {
  const rol =
    c.usuario_id === null ? "Automático" : esRol(c.rol) ? NOMBRE_DEL_ROL[c.rol] : "Sin rol";
  return `${rol} · ${formatearFechaLima(c.ocurrido_en)}`;
}

/**
 * Una tarjeta por cambio, en el celular y en la computadora: es una frase, no
 * una tabla. Cada una lleva al detalle del cambio.
 */
export function ListaDeCambios({
  cambios,
  nombres,
  etiqueta,
}: {
  cambios: readonly Cambio[];
  nombres: Nombres;
  etiqueta: string;
}) {
  return (
    <ul aria-label={etiqueta} className="flex flex-col gap-2">
      {cambios.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/auditoria/${c.id}`}
            className="bg-card hover:bg-muted flex min-h-11 flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
            data-cambio={c.id}
          >
            <span>
              <strong className="font-semibold">{quien(c)}</strong> {accion(c, nombres)}
            </span>
            <span className="text-muted-foreground text-sm">{pie(c)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
