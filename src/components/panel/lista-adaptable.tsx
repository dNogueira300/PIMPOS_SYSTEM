import Link from "next/link";
import type { ReactNode } from "react";

export type Columna<F> = {
  titulo: string;
  celda: (fila: F) => ReactNode;
  /** La que da nombre a la fila: en la tarjeta va arriba y en negrita. */
  principal?: boolean;
};

type Props<F extends { id: string }> = {
  filas: readonly F[];
  columnas: readonly Columna<F>[];
  enlace: (fila: F) => string;
  /** Lo que se ve cuando no hay nada: qué es y cómo empezar. */
  vacio: ReactNode;
  /** Botones por fila (ordenar, borrar). Van fuera del enlace. */
  acciones?: (fila: F) => ReactNode;
  etiqueta: string;
};

/**
 * Tabla en escritorio, tarjetas a 375 px (doc 03 §5.1). Nunca una tabla con
 * desplazamiento lateral: en el celular no se ve la columna que importa.
 */
export function ListaAdaptable<F extends { id: string }>({
  filas,
  columnas,
  enlace,
  vacio,
  acciones,
  etiqueta,
}: Props<F>) {
  if (filas.length === 0) {
    return <div className="bg-card rounded-xl border p-6 text-center">{vacio}</div>;
  }

  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const resto = columnas.filter((c) => c !== principal);

  return (
    <>
      <ul aria-label={etiqueta} className="flex flex-col gap-2 md:hidden">
        {filas.map((fila) => (
          <li key={fila.id} className="bg-card flex items-center gap-2 rounded-xl border p-3">
            <Link href={enlace(fila)} className="flex min-h-11 flex-1 flex-col justify-center">
              <span className="font-semibold">{principal.celda(fila)}</span>
              <span className="text-muted-foreground flex flex-wrap gap-x-2 text-sm">
                {resto.map((c) => (
                  <span key={c.titulo}>{c.celda(fila)}</span>
                ))}
              </span>
            </Link>
            {acciones ? <div className="flex items-center gap-1">{acciones(fila)}</div> : null}
          </li>
        ))}
      </ul>

      <table className="bg-card hidden w-full overflow-hidden rounded-xl border text-sm md:table">
        <caption className="sr-only">{etiqueta}</caption>
        <thead className="bg-muted text-left">
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} scope="col" className="px-4 py-3 font-semibold">
                {c.titulo}
              </th>
            ))}
            {acciones ? (
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-t">
              {columnas.map((c) => (
                <td key={c.titulo} className="px-4 py-2">
                  {c === principal ? (
                    <Link
                      href={enlace(fila)}
                      className="inline-flex min-h-11 items-center font-semibold hover:underline"
                    >
                      {c.celda(fila)}
                    </Link>
                  ) : (
                    c.celda(fila)
                  )}
                </td>
              ))}
              {acciones ? (
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">{acciones(fila)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
