import type { ReactNode } from "react";

import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlDeImagen } from "@/lib/supabase/publico";

import { LogoMarca } from "./logo-marca";

/** La configuración está cacheada por marca; la sesión sigue en su límite de Suspense. */
export async function CascaraAcceso({ children }: { children: ReactNode }) {
  const config = await obtenerConfiguracion();
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-5 py-6 md:p-0">
      <main className="border-border bg-card border-t-primary grid w-full max-w-[440px] gap-7 rounded-lg border border-t-[5px] px-6 py-7 md:min-h-dvh md:max-w-none md:grid-cols-[42%_minmax(0,1fr)] md:gap-0 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <div className="md:bg-primary flex items-center justify-center md:py-10">
          <div className="bg-background grid size-40 shrink-0 place-items-center rounded-full p-4 md:size-[min(24vw,350px)]">
            <LogoMarca
              src={urlDeImagen("marca", config.logo_url) ?? "/marca/logo.webp"}
              alt={config.logo_alt}
              sizes="(min-width: 1440px) 350px, (min-width: 768px) 24vw, 160px"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-center md:px-5 md:py-8">
          <div className="flex w-full max-w-[440px] flex-col gap-7 md:p-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
