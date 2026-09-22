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
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {SUBSECCIONES_DE_CONTENIDO.map((s) => (
          <li key={s.ruta}>
            <Link href={s.ruta} className="tarjeta flex min-h-20 items-center p-4 font-semibold">
              {s.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
