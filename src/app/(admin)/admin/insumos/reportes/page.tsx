import Link from "next/link";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { REPORTES } from "@/lib/insumos/reportes";

export default function Reportes() {
  return (
    <>
      <EncabezadoPanel titulo="Reportes" volver={{ ruta: "/admin/insumos", nombre: "Insumos" }} />
      <ul className="border-border grid gap-0 border-t sm:grid-cols-2">
        {Object.entries(REPORTES).map(([slug, r]) => (
          <li key={slug}>
            <Link
              href={`/admin/insumos/reportes/${slug}`}
              className="border-border hover:bg-muted flex min-h-20 flex-col justify-center border-b px-3 py-5"
            >
              <span className="font-semibold">{r.titulo}</span>
              <span className="text-muted-foreground text-sm">{r.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
