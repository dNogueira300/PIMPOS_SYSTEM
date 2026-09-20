import Link from "next/link";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { SUBSECCIONES_DE_CONTENIDO } from "@/lib/panel/navegacion";

/**
 * Las pantallas se construyen tarea a tarea. Cada tarea añade su ruta aquí;
 * así el índice nunca enlaza a un 404.
 */
const CONSTRUIDAS: readonly string[] = ["/admin/contenido/categorias"];

export default function Contenido() {
  const disponibles = SUBSECCIONES_DE_CONTENIDO.filter((s) => CONSTRUIDAS.includes(s.ruta));

  return (
    <>
      <EncabezadoPanel
        titulo="Contenido"
        descripcion="Lo que se ve en el sitio. Los cambios se publican al guardar."
      />
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {disponibles.map((s) => (
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
