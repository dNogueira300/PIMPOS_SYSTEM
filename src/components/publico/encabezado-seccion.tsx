import type { ReactNode } from "react";

/**
 * Encabezado de las paginas de seccion.
 *
 * Existe para que las siete secciones empiecen igual sin repetir el marcado en
 * siete archivos.
 *
 * Desde la fase 3.1 (plan 03.1, tarea 8) va sobre el crema oscuro y no sobre el
 * azul institucional: en el prototipo de Stitch el azul es el color de las
 * cosas que se pulsan y de los titulares, y una franja azul entera en cada
 * pagina le quitaba al boton de pedir el unico sitio donde destacaba. Lo que
 * separa el encabezado del contenido es ahora el cambio de fondo y el titular
 * en azul.
 *
 * La entradilla admite marcado y no solo texto: cuando dice "escríbenos por
 * WhatsApp", eso tiene que poder pulsarse.
 */
export function EncabezadoSeccion({
  titulo,
  entradilla,
}: {
  titulo: string;
  entradilla?: ReactNode;
}) {
  return (
    <div className="bg-muted border-border border-b">
      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-primary text-4xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-5xl">
          {titulo}
        </h1>
        {entradilla ? (
          <p className="text-muted-foreground mt-3 max-w-prose text-lg text-pretty">{entradilla}</p>
        ) : null}
      </div>
    </div>
  );
}
