import type { Metadata } from "next";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";
import { CascaraAcceso } from "@/components/marca/cascara-acceso";

import { FormularioCambioClave } from "./formulario";

export const metadata: Metadata = {
  title: "Cambia tu contraseña",
  robots: { index: false, follow: false },
};

/**
 * Sin sesión, el proxy manda al ingreso antes de llegar aquí; con contraseña
 * temporal, el proxy trae aquí desde cualquier ruta del panel.
 */
export default function CambiarClave() {
  return (
    <CascaraAcceso>
      <div className="text-center md:text-left">
        <h1 className="text-foreground text-[25px] leading-tight font-semibold">
          Cambia tu contraseña
        </h1>
        <p className="text-muted-foreground mt-2">
          Elige una contraseña que solo sepas tú. Si entraste con una temporal, desde ahora deja de
          servir.
        </p>
      </div>
      {/* `FormularioPanel` lee la hora al montar (la copia local caduca): con
          Cache Components eso no se prerenderiza, va dentro de <Suspense>. */}
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <FormularioCambioClave />
      </Suspense>
      {/* El <Toaster> del panel vive en su cáscara, que no envuelve a (auth). */}
      <Toaster position="top-center" richColors />
    </CascaraAcceso>
  );
}
