import type { ReactNode } from "react";

import {
  AVISO_SIN_COSTO,
  formatearCelda,
  formatearSoles,
  marcarSinCosto,
} from "@/lib/insumos/formato-reporte";
import type { Columna, Reporte } from "@/lib/insumos/reportes";

/**
 * El valor de una celda, con el aviso de costo desconocido cuando aplica
 * (revisión de tarea 6, hallazgo I-2). La marca sale de `marcarSinCosto`, la
 * misma que usan el Excel y el PDF; aquí va `aria-hidden` porque leída en voz
 * alta no dice nada, y el texto real del aviso va aparte, en `sr-only`, para
 * no depender de que alguien vea el símbolo.
 */
function celda(valor: string | number | null, columna: Columna, sinCosto: boolean): ReactNode {
  const texto = formatearCelda(valor, columna.tipo);
  const marca = marcarSinCosto(texto, columna.tipo, sinCosto).slice(texto.length);
  if (!marca) return texto;
  return (
    <>
      {texto}
      <span aria-hidden="true">{marca}</span>
      <span className="sr-only">, incluye cantidades sin costo registrado</span>
    </>
  );
}

/**
 * La tabla del reporte. En el celular cada fila es una tarjeta (restricción
 * global: nunca desplazamiento lateral); en escritorio, una tabla con `caption`.
 */
export function TablaReporte({ reporte }: { reporte: Reporte }) {
  const { columnas, filas, total, titulo, sinCosto, hayCostosDesconocidos } = reporte;
  if (filas.length === 0) {
    // El kárdex sin insumo elegido no tiene columnas: no es que no haya datos.
    const texto =
      reporte.slug === "kardex" && columnas.length === 0
        ? "Elige un insumo para ver su kárdex."
        : "No hay datos en ese periodo.";
    return <p className="bg-card rounded-md border p-6 text-center">{texto}</p>;
  }
  const [principal, ...resto] = columnas;
  return (
    <>
      <ul
        aria-label={titulo}
        className="border-border bg-card divide-border divide-y rounded-md border md:hidden"
      >
        {filas.map((f, i) => (
          <li key={i} className="p-4 text-sm wrap-anywhere">
            <p className="font-semibold">
              {celda(f[principal!.clave] ?? null, principal!, sinCosto[i] ?? false)}
            </p>
            <dl className="grid grid-cols-2 gap-x-2">
              {resto.map((c) => (
                <div key={c.clave} className="col-span-2 grid grid-cols-2">
                  <dt className="text-muted-foreground">{c.titulo}</dt>
                  <dd>{celda(f[c.clave] ?? null, c, sinCosto[i] ?? false)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <table className="bg-card hidden w-full rounded-md border text-sm md:table">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={`p-2 ${c.tipo === "texto" ? "text-left" : "text-right"}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-border even:bg-muted/40 hover:bg-muted/60 border-t">
              {columnas.map((c) => (
                <td
                  key={c.clave}
                  className={`p-3 wrap-anywhere ${c.tipo === "texto" ? "" : "text-right tabular-nums"}`}
                >
                  {celda(f[c.clave] ?? null, c, sinCosto[i] ?? false)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total !== null ? (
        <p className="mt-3 text-right text-lg font-semibold" data-total>
          Total: {formatearSoles(total)}
        </p>
      ) : null}
      {hayCostosDesconocidos ? (
        <p className="text-muted-foreground mt-1 text-sm">{AVISO_SIN_COSTO}</p>
      ) : null}
    </>
  );
}
