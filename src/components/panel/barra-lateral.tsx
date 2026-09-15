"use client";

import { ExternalLink, House, LayoutGrid, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { esSeccionActiva, type NombreIcono, type SeccionPanel } from "@/lib/panel/navegacion";

export const ICONOS: Record<NombreIcono, typeof House> = {
  inicio: House,
  contenido: LayoutGrid,
  usuarios: Users,
  configuracion: Settings,
};

type Props = { secciones: SeccionPanel[]; nombre: string; rol: string };

export function BarraLateral({ secciones, nombre, rol }: Props) {
  const actual = usePathname();

  return (
    <aside className="bg-primary text-primary-foreground sticky top-0 hidden h-dvh flex-col gap-1 p-3 md:flex">
      <p className="font-heading px-3 pt-2 pb-4 text-lg">Pimpo&apos;s · Panel</p>
      <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
        {secciones.map((seccion) => {
          const Icono = ICONOS[seccion.icono];
          const activa = esSeccionActiva(actual, seccion.ruta);
          return (
            <Link
              key={seccion.ruta}
              href={seccion.ruta}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${
                activa
                  ? "bg-panel-lateral-activo font-semibold"
                  : "hover:bg-panel-lateral-hover opacity-85"
              }`}
            >
              <Icono aria-hidden className="size-5" />
              {seccion.nombre}
            </Link>
          );
        })}
      </nav>
      <div className="border-panel-lateral-borde mt-auto flex flex-col gap-1 border-t pt-3 text-sm">
        <p className="px-3">
          {nombre}
          <span className="block text-xs opacity-75">{rol}</span>
        </p>
        <Link
          href="/"
          target="_blank"
          className="hover:bg-panel-lateral-hover flex min-h-11 items-center gap-3 rounded-lg px-3"
        >
          <ExternalLink aria-hidden className="size-5" /> Ver el sitio
        </Link>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="hover:bg-panel-lateral-hover flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left"
          >
            <LogOut aria-hidden className="size-5" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
