import Link from "next/link";

import type { Periodo } from "@/lib/insumos/periodo";

/** Atajos y fechas libres. Es un formulario GET: el periodo vive en la URL y se puede compartir. */
export function SelectorPeriodo({
  ruta,
  periodo,
  semana,
  mes,
  extra,
}: {
  ruta: string;
  periodo: Periodo;
  semana: Periodo;
  mes: Periodo;
  /** Parámetros que el formulario conserva (el insumo del kárdex). */
  extra?: Record<string, string>;
}) {
  const enlace = (p: Periodo) => `${ruta}?${new URLSearchParams({ ...extra, ...p }).toString()}`;
  return (
    <div className="bg-muted/40 border-border mb-4 flex min-w-0 flex-col gap-3 rounded-md border p-4">
      <div className="flex flex-wrap gap-2">
        <Link href={enlace(semana)} className="boton-linea">
          Esta semana
        </Link>
        <Link href={enlace(mes)} className="boton-linea">
          Este mes
        </Link>
      </div>
      <form className="flex flex-wrap items-end gap-2">
        {Object.entries(extra ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="flex flex-col gap-1 text-sm">
          <span>Desde</span>
          <input
            type="date"
            name="desde"
            defaultValue={periodo.desde}
            className="border-input bg-card min-h-11 rounded-md border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Hasta</span>
          <input
            type="date"
            name="hasta"
            defaultValue={periodo.hasta}
            className="border-input bg-card min-h-11 rounded-md border px-3"
          />
        </label>
        <button type="submit" className="boton-linea">
          Ver
        </button>
      </form>
    </div>
  );
}
