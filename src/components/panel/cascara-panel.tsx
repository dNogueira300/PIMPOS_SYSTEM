import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { NOMBRE_DEL_ROL, type Rol } from "@/lib/auth/roles";
import { seccionesPara } from "@/lib/panel/navegacion";

import { BarraInferior } from "./barra-inferior";
import { BarraLateral } from "./barra-lateral";

type Props = { rol: Rol; nombre: string; children: ReactNode };

export function CascaraPanel({ rol, nombre, children }: Props) {
  const secciones = seccionesPara(rol);
  const nombreDelRol = NOMBRE_DEL_ROL[rol];

  return (
    <div className="bg-background min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <BarraLateral secciones={secciones} nombre={nombre} rol={nombreDelRol} />
      {/* El hueco de la barra inferior va en el último bloque, no en <main>:
          es la trampa del botón flotante de F3. */}
      <div className="flex min-h-dvh flex-col">
        <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 md:px-8 md:py-8">
          {children}
        </main>
        <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      </div>
      <BarraInferior secciones={secciones} nombre={nombre} rol={nombreDelRol} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
