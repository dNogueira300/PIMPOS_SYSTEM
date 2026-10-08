import type { ReactNode } from "react";

import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlDeImagen } from "@/lib/supabase/publico";

import { LogoMarca } from "./logo-marca";

/** La configuración está cacheada por marca; la sesión sigue en su límite de Suspense. */
export async function CascaraAcceso({
  children,
  movilOndulado = false,
  cabecera,
}: {
  children: ReactNode;
  movilOndulado?: boolean;
  cabecera?: ReactNode;
}) {
  const config = await obtenerConfiguracion();
  const logo = (
    <div className="bg-background grid aspect-square w-40 max-w-full shrink-0 place-items-center rounded-full p-4 md:size-[min(24vw,350px)]">
      <LogoMarca
        src={urlDeImagen("marca", config.logo_url) ?? "/marca/logo.webp"}
        alt={config.logo_alt}
        sizes="(min-width: 1440px) 350px, (min-width: 768px) 24vw, 160px"
        className="h-full w-full object-contain"
      />
    </div>
  );
  if (movilOndulado) {
    return (
      <div className="bg-background min-h-dvh">
        <main className="grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] content-start md:grid-cols-[42%_minmax(0,1fr)] md:grid-rows-[1fr_auto_auto_1fr] md:content-normal">
          <div className="bg-primary relative isolate flex items-start justify-center overflow-hidden px-8 pt-8 md:col-start-1 md:row-span-4 md:row-start-1 md:items-center md:px-0 md:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 md:hidden"
            >
              <div className="bg-foreground/10 absolute -top-10 -left-12 h-32 w-64 rotate-[-16deg] rounded-[45%_55%_60%_40%]" />
              <div className="bg-primary-foreground/10 absolute top-14 -right-14 h-28 w-44 rotate-[-24deg] rounded-[60%_40%_55%_45%]" />
              <div className="bg-primary-foreground/10 absolute top-10 right-16 size-6 rounded-full" />
            </div>
            {logo}
          </div>
          <div className="bg-primary text-primary-foreground md:text-foreground relative px-8 pt-5 pb-20 text-center md:col-start-2 md:row-start-2 md:w-[calc(100%_-_40px)] md:max-w-[440px] md:justify-self-center md:bg-transparent md:px-10 md:pt-10 md:pb-0 md:text-left">
            {cabecera}
            <svg
              aria-hidden="true"
              viewBox="0 0 390 64"
              preserveAspectRatio="none"
              className="text-background pointer-events-none absolute -bottom-px left-0 h-16 w-full md:hidden"
            >
              <path d="M0 29C70-8 112 0 183 25S310 71 390 27V64H0Z" fill="currentColor" />
            </svg>
          </div>
          <div className="px-8 pt-7 pb-12 md:col-start-2 md:row-start-3 md:w-[calc(100%_-_40px)] md:max-w-[440px] md:justify-self-center md:px-10 md:pb-10">
            <div className="mx-auto flex w-full max-w-[440px] flex-col gap-7">{children}</div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-5 py-6 md:p-0">
      <main className="border-border bg-card border-t-primary grid w-full max-w-[440px] gap-7 rounded-lg border border-t-[5px] px-6 py-7 md:min-h-dvh md:max-w-none md:grid-cols-[42%_minmax(0,1fr)] md:gap-0 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <div className="md:bg-primary flex items-center justify-center md:py-10">{logo}</div>
        <div className="flex min-w-0 items-center justify-center md:px-5 md:py-8">
          <div className="flex w-full max-w-[440px] flex-col gap-7 md:p-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
