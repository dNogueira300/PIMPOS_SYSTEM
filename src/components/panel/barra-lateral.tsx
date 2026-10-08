"use client";

import {
  Contact,
  ExternalLink,
  History,
  House,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMarca } from "@/components/marca/logo-marca";

import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { olvidarBorradoresDelNavegador } from "@/lib/panel/borrador";
import { esSeccionActiva, type NombreIcono, type SeccionPanel } from "@/lib/panel/navegacion";

export const ICONOS: Record<NombreIcono, typeof House> = {
  inicio: House,
  contenido: LayoutGrid,
  insumos: Package,
  clientes: Contact,
  usuarios: Users,
  historial: History,
  configuracion: Settings,
};

type Props = {
  secciones: SeccionPanel[];
  nombre: string;
  rol: string;
  logoSrc: string;
  logoAlt: string;
};

export function BarraLateral({ secciones, nombre, rol, logoSrc, logoAlt }: Props) {
  const actual = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh flex-col gap-1 overflow-y-auto border-r px-4 py-6 md:flex">
      <LogoMarca
        src={logoSrc}
        alt={logoAlt}
        sizes="128px"
        className="mx-auto mb-2 h-auto w-32 shrink-0 object-contain"
      />
      <p className="pb-6 text-center text-xs tracking-wide">Pimpo&apos;s · Panel</p>
      <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
        {secciones.map((seccion) => {
          const Icono = ICONOS[seccion.icono];
          const activa = esSeccionActiva(actual, seccion.ruta);
          return (
            <Link
              key={seccion.ruta}
              href={seccion.ruta}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-[46px] items-center gap-3 rounded-sm px-3 text-sm ${
                activa
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-panel-lateral-hover"
              }`}
            >
              <Icono aria-hidden className="size-5" />
              {seccion.nombre}
            </Link>
          );
        })}
      </nav>
      <div className="border-panel-lateral-borde mt-auto flex flex-col gap-1 border-t pt-3 text-sm">
        <p className="px-3 break-words">
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
        <form action={cerrarSesion} onSubmit={olvidarBorradoresDelNavegador}>
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
