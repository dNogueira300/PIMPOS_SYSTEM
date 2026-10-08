import { Pencil } from "lucide-react";
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
  /**
   * A dónde lleva el lápiz «Editar». Casi siempre es lo mismo que `enlace`;
   * en insumos, el nombre abre la ficha y el lápiz, el formulario. Pulsar el
   * nombre no se descubría (Dan, 29/09/2026): editar tiene su icono propio.
   */
  editar?: (fila: F) => string;
  /**
   * El nombre de la fila para el lápiz («Editar Harina»). Por defecto, el
   * texto de la columna principal; hace falta cuando esa columna no es texto
   * (la miniatura de galería).
   */
  nombreFila?: (fila: F) => string;
  /** El texto del lápiz: «Editar» por defecto; «Corregir» para el repartidor (F6). */
  etiquetaEditar?: string;
  /**
   * En el celular, los botones van en su propia fila, debajo del nombre. Para
   * acciones con texto («Sigue siendo cliente»): junto al nombre lo dejaban
   * en 0 px de ancho a 375 px (F6, T5).
   */
  accionesDebajo?: boolean;
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
  editar,
  nombreFila,
  etiquetaEditar = "Editar",
  accionesDebajo = false,
  etiqueta,
}: Props<F>) {
  if (filas.length === 0) {
    return <div className="bg-card rounded-md border p-6 text-center">{vacio}</div>;
  }

  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const resto = columnas.filter((c) => c !== principal);
  const hayAcciones = Boolean(acciones || editar);
  const nombreDe = (fila: F): string => {
    if (nombreFila) return nombreFila(fila);
    const texto = principal.celda(fila);
    return typeof texto === "string" || typeof texto === "number" ? String(texto) : "";
  };

  // Mismo tamaño y forma que el botón de borrar (`ConfirmarBorrado`): 44 px.
  const botones = (fila: F) => (
    <>
      {editar ? (
        // `aria-label` y no un texto oculto: un segundo «Harina» en la página
        // (aunque invisible) confunde a quien busca la fila por su nombre.
        <Link
          href={editar(fila)}
          aria-label={`${etiquetaEditar} ${nombreDe(fila)}`.trim()}
          className="text-primary hover:bg-primary/10 inline-flex size-11 shrink-0 items-center justify-center rounded-md"
        >
          <Pencil aria-hidden className="size-5" />
        </Link>
      ) : null}
      {acciones?.(fila)}
    </>
  );

  return (
    <>
      <ul
        aria-label={etiqueta}
        className="border-border flex flex-col overflow-hidden rounded-md border md:hidden"
      >
        {filas.map((fila) => (
          <li
            key={fila.id}
            className={`bg-card border-border flex items-center gap-2 border-b px-3 py-4 last:border-b-0 ${accionesDebajo ? "flex-wrap" : ""}`}
          >
            {/* `min-w-0` y `wrap-anywhere`: una palabra larga se corta en vez de
                empujar los botones fuera de la tarjeta (a 375 px caben cuatro,
                44 px cada uno, y al texto le queda poco). */}
            <Link
              href={enlace(fila)}
              className="flex min-h-11 min-w-0 flex-1 flex-col justify-center wrap-anywhere"
            >
              <span className="font-semibold">{principal.celda(fila)}</span>
              <span className="text-muted-foreground flex flex-wrap gap-x-2 text-sm">
                {resto.map((c) => (
                  <span key={c.titulo}>{c.celda(fila)}</span>
                ))}
              </span>
            </Link>
            {hayAcciones ? (
              <div
                className={
                  accionesDebajo
                    ? "flex w-full flex-wrap items-center justify-end gap-2"
                    : "flex shrink-0 items-center gap-1"
                }
              >
                {botones(fila)}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <table className="bg-card hidden w-full overflow-hidden rounded-md border text-sm md:table">
        <caption className="sr-only">{etiqueta}</caption>
        <thead className="bg-muted text-left">
          <tr>
            {columnas.map((c) => (
              <th
                key={c.titulo}
                scope="col"
                className="px-4 py-3 text-xs font-semibold tracking-wide"
              >
                {c.titulo}
              </th>
            ))}
            {hayAcciones ? (
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Acción
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-border even:bg-muted/40 hover:bg-muted/60 border-t">
              {columnas.map((c) => (
                <td key={c.titulo} className="px-4 py-2 wrap-anywhere tabular-nums">
                  {c === principal ? (
                    <Link
                      href={enlace(fila)}
                      className="inline-flex min-h-11 min-w-11 items-center font-semibold hover:underline"
                    >
                      {c.celda(fila)}
                    </Link>
                  ) : (
                    c.celda(fila)
                  )}
                </td>
              ))}
              {hayAcciones ? (
                <td className="px-4 py-2 tabular-nums">
                  {/* `flex-wrap`: con botones de texto al lado («Para revisar», F6), el
                      lápiz encogía por debajo de 44 px en vez de bajar de línea. */}
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {botones(fila)}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
