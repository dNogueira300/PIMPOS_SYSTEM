"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, RotateCw } from "lucide-react";

/**
 * Cuando algo falla al cargar una seccion del sitio publico.
 *
 * Tiene que ser un componente de cliente: Next lo usa como limite de error de
 * React. Va dentro del layout publico, asi que la cabecera, el pie y el boton
 * de WhatsApp siguen en su sitio; solo se sustituye lo que fallo.
 *
 * `retry` y no `reset`: en Next 16.3 `retry` vuelve a pedir los datos y a
 * pintar, que es lo que arregla un fallo pasajero de red o de la base. `reset`
 * solo limpia el estado y volveria a fallar igual.
 *
 * El detalle del error va a la consola y no a la pantalla: docs/marca.md pide
 * que un error explique que hacer y nunca muestre un codigo. Quien lo arregla
 * busca el `digest` en los registros del servidor.
 */
export default function ErrorDelSitio({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-(--container-contenido) px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl text-balance sm:text-5xl">
          No pudimos cargar esta página
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Puede ser la conexión o un problema de nuestro lado. Intenta de nuevo en un momento. Si
          sigue sin cargar, pídenos lo que necesites por WhatsApp: el botón está siempre a mano.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={() => retry()} className="boton-cta">
            <RotateCw aria-hidden className="size-5" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="text-acento focus-visible:outline-ring min-h-tactil inline-flex items-center gap-1.5 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Volver al inicio
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
