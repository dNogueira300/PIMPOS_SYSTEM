/**
 * Encabezado de las paginas de seccion.
 *
 * Existe para que las siete secciones empiecen igual sin repetir el marcado en
 * siete archivos. Va sobre el azul institucional: es lo que separa una seccion
 * del sitio del crema del contenido, y ademas hace de ancla visual al llegar
 * desde la navegacion.
 */
export function EncabezadoSeccion({ titulo, entradilla }: { titulo: string; entradilla?: string }) {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-(--container-contenido) px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-4xl text-balance sm:text-5xl">{titulo}</h1>
        {entradilla ? (
          <p className="text-primary-foreground/85 mt-3 max-w-prose text-lg text-pretty">
            {entradilla}
          </p>
        ) : null}
      </div>
    </div>
  );
}
