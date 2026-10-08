import Link from "next/link";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { SUBSECCIONES_DE_CONTENIDO } from "@/lib/panel/navegacion";

export default function Contenido() {
  return (
    <>
      <EncabezadoPanel
        titulo="Contenido"
        descripcion="Lo que se ve en el sitio. Los cambios se publican al guardar."
      />
      <ul className="border-border grid grid-cols-2 gap-0 border-t md:grid-cols-4">
        {SUBSECCIONES_DE_CONTENIDO.map((s) => (
          <li key={s.ruta}>
            <Link
              href={s.ruta}
              className="border-border hover:bg-muted flex min-h-20 items-center border-b px-3 py-5 font-semibold"
            >
              {s.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
