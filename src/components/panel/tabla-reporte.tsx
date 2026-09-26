import type { ReactNode } from "react";

import { formatearCelda, formatearSoles } from "@/lib/insumos/formato-reporte";
import type { Columna, Reporte } from "@/lib/insumos/reportes";

const AVISO_SIN_COSTO =
  "* Parte de esta cantidad no tiene costo registrado, así que su costo no está incluido. Se corrige registrando el precio en el próximo conteo o ingreso.";

/**
 * El valor de una celda, con el aviso de costo desconocido cuando aplica
 * (revisión de tarea 6, hallazgo I-2): el asterisco es `aria-hidden` porque
 * leído en voz alta no dice nada, y el texto real del aviso va aparte, en
 * `sr-only`, para no depender de que alguien vea el símbolo.
 */
function celda(valor: string | number | null, columna: Columna, sinCosto: boolean): ReactNode {
  const texto = formatearCelda(valor, columna.tipo);
  if (columna.tipo !== "soles" || !sinCosto) return texto;
  return (
    <>
      {texto} <span aria-hidden="true">*</span>
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
    return (
      <p className="bg-card rounded-xl border p-6 text-center">No hay datos en ese periodo.</p>
    );
  }
  const [principal, ...resto] = columnas;
  return (
    <>
      <ul aria-label={titulo} className="flex flex-col gap-2 md:hidden">
        {filas.map((f, i) => (
          <li key={i} className="bg-card rounded-xl border p-3 text-sm">
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
      <table className="bg-card hidden w-full rounded-xl border text-sm md:table">
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
            <tr key={i} className="border-t">
              {columnas.map((c) => (
                <td
                  key={c.clave}
                  className={`p-2 ${c.tipo === "texto" ? "" : "text-right tabular-nums"}`}
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
