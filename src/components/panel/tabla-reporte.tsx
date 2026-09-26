import { formatearCelda, formatearSoles } from "@/lib/insumos/formato-reporte";
import type { Reporte } from "@/lib/insumos/reportes";

/**
 * La tabla del reporte. En el celular cada fila es una tarjeta (restricción
 * global: nunca desplazamiento lateral); en escritorio, una tabla con `caption`.
 */
export function TablaReporte({ reporte }: { reporte: Reporte }) {
  const { columnas, filas, total, titulo } = reporte;
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
              {formatearCelda(f[principal!.clave] ?? null, principal!.tipo)}
            </p>
            <dl className="grid grid-cols-2 gap-x-2">
              {resto.map((c) => (
                <div key={c.clave} className="col-span-2 grid grid-cols-2">
                  <dt className="text-muted-foreground">{c.titulo}</dt>
                  <dd>{formatearCelda(f[c.clave] ?? null, c.tipo)}</dd>
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
                  {formatearCelda(f[c.clave] ?? null, c.tipo)}
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
    </>
  );
}
