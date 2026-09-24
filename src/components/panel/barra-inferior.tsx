"use client";

import { Ellipsis, ExternalLink, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cerrarSesion } from "@/lib/acciones/autenticacion";
import { olvidarBorradoresDelNavegador } from "@/lib/panel/borrador";
import { esSeccionActiva, type SeccionPanel } from "@/lib/panel/navegacion";

import { ICONOS } from "./barra-lateral";

type Props = { secciones: SeccionPanel[]; nombre: string; rol: string };

/**
 * Navegación del celular: fija abajo, al alcance del pulgar (decisión 9).
 * Las secciones que no caben van en «Más», junto a «Ver el sitio» y
 * «Cerrar sesión».
 */
export function BarraInferior({ secciones, nombre, rol }: Props) {
  const actual = usePathname();
  const visibles = secciones.filter((s) => s.enBarraInferior);
  const enMas = secciones.filter((s) => !s.enBarraInferior);

  return (
    <nav
      aria-label="Secciones del panel, en la barra inferior"
      className="bg-card border-border fixed inset-x-0 bottom-0 z-40 grid border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${visibles.length + 1}, minmax(0, 1fr))` }}
    >
      {visibles.map((seccion) => {
        const Icono = ICONOS[seccion.icono];
        const activa = esSeccionActiva(actual, seccion.ruta);
        return (
          <Link
            key={seccion.ruta}
            href={seccion.ruta}
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
              activa ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icono aria-hidden className="size-5" />
            {seccion.nombre}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger className="text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs">
          <Ellipsis aria-hidden className="size-5" />
          Más
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-1 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="flex-row items-start justify-between">
            <SheetTitle>
              {nombre}{" "}
              <span className="text-muted-foreground block text-sm font-normal">{rol}</span>
            </SheetTitle>
            {/* El cierre por defecto de shadcn mide 28 px (`size="icon-sm"`);
                el panel no usa esas variantes por lo mismo que no usa
                `Button` para sus botones (no llegan al area tactil). Este es
                un boton propio de 44 px, con la equis dentro. */}
            <SheetClose
              aria-label="Cerrar"
              className="hover:bg-muted -mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full"
            >
              <X aria-hidden className="size-5" />
            </SheetClose>
          </SheetHeader>
          {enMas.map((seccion) => {
            const Icono = ICONOS[seccion.icono];
            return (
              <Link
                key={seccion.ruta}
                href={seccion.ruta}
                className="flex min-h-12 items-center gap-3 px-4"
              >
                <Icono aria-hidden className="size-5" /> {seccion.nombre}
              </Link>
            );
          })}
          <Link href="/" target="_blank" className="flex min-h-12 items-center gap-3 px-4">
            <ExternalLink aria-hidden className="size-5" /> Ver el sitio
          </Link>
          <form action={cerrarSesion} onSubmit={olvidarBorradoresDelNavegador}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 px-4 text-left"
            >
              <LogOut aria-hidden className="size-5" /> Cerrar sesión
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
