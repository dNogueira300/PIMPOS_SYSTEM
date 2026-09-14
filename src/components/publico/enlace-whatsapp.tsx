import type { ReactNode } from "react";

const CLASES = {
  claro:
    "text-acento focus-visible:outline-ring font-medium underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2",
  // La variante `sobre-azul` se retiró en la fase 3.1: el encabezado de las
  // páginas, que era el único fondo azul con una frase enlazada, pasó a crema.
} as const;

/**
 * "escríbenos por WhatsApp" dentro de una frase, convertido en enlace.
 *
 * Una pagina que dice "escríbenos por WhatsApp" y no deja pulsarlo manda al
 * cliente a buscar el boton por su cuenta. Si el negocio no cargo numero, queda
 * el texto sin enlace: mejor eso que un wa.me que no le llega a nadie.
 */
export function EnlaceWhatsApp({
  enlace,
  variante = "claro",
  children,
}: {
  enlace: string | null;
  variante?: keyof typeof CLASES;
  children: ReactNode;
}) {
  if (enlace === null) return <>{children}</>;

  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" className={CLASES[variante]}>
      {children}
    </a>
  );
}
