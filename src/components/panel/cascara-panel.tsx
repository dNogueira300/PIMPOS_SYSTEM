import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { LogoMarca } from "@/components/marca/logo-marca";
import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { seccionesPara } from "@/lib/panel/navegacion";

import { BarraInferior } from "./barra-inferior";
import { BarraLateral } from "./barra-lateral";

type Props = { rol: Rol; nombre: string; logoSrc: string; logoAlt: string; children: ReactNode };

export function CascaraPanel({ rol, nombre, logoSrc, logoAlt, children }: Props) {
  const secciones = seccionesPara(rol);
  const nombreDelRol = NOMBRE_DEL_ROL[rol];

  return (
    <div className="bg-background min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <BarraLateral
        secciones={secciones}
        nombre={nombre}
        rol={nombreDelRol}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
      />
      {/* El hueco de la barra inferior va en el último bloque, no en <main>:
          es la trampa del botón flotante de F3. */}
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="bg-card border-border flex min-h-[78px] items-center gap-3.5 border-b px-4 py-2.5 text-[13px] font-semibold md:hidden">
          <LogoMarca
            src={logoSrc}
            alt={logoAlt}
            sizes="70px"
            className="h-14 w-[70px] shrink-0 object-contain"
          />
          <span>Pimpo&apos;s · Panel</span>
        </header>
        <main
          id="contenido"
          className="mx-auto w-full max-w-[1240px] min-w-0 flex-1 px-4 py-5 md:px-8 md:py-10 lg:px-12"
        >
          {children}
        </main>
        <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      </div>
      <BarraInferior secciones={secciones} nombre={nombre} rol={nombreDelRol} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
