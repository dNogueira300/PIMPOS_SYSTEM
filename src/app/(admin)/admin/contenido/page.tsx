import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { puedeAcceder } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { SUBSECCIONES_DE_CONTENIDO } from "@/lib/panel/navegacion";

export default function Contenido() {
  return (
    <>
      <EncabezadoPanel
        titulo="Contenido"
        descripcion="Lo que se ve en el sitio. Los cambios se publican al guardar."
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Subsecciones />
      </Suspense>
    </>
  );
}

/**
 * Cada rol ve solo las subsecciones en las que puede entrar: Temáticas es de la
 * administración (plan 08), y un enlace que lleva a «no tienes acceso» no le
 * sirve al ingeniero. La sesión se lee aquí, dentro del `Suspense`.
 */
async function Subsecciones() {
  const sesion = await exigirAcceso("/admin/contenido");
  const visibles = SUBSECCIONES_DE_CONTENIDO.filter((s) => puedeAcceder(sesion.rol, s.ruta));
  return (
    <ul className="border-border grid grid-cols-2 gap-0 border-t md:grid-cols-4">
      {visibles.map((s) => (
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
  );
}
