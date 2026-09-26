"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatearSoles } from "@/lib/insumos/formato-reporte";

/**
 * Barras horizontales: los nombres de insumo son largos y a 375 px no caben
 * debajo de una barra vertical. El gráfico es decorativo para un lector de
 * pantalla (`aria-hidden`): la tabla de al lado dice lo mismo con números.
 *
 * Sigue la skill `dataviz`: una sola serie no necesita leyenda (el título ya
 * la nombra) ni una paleta categórica — la barra usa el único azul primario
 * del sistema (`--primary`). Como son como mucho diez barras (`primeros()` en
 * `reportes.ts`), la etiqueta de valor en cada una es una etiqueta directa
 * selectiva, no "un número en cada punto" de una serie densa; va en el color
 * de texto silenciado (`--muted-foreground`), nunca en el color de la serie,
 * y el eje numérico se oculta porque esa etiqueta ya dice el valor exacto.
 */
export function GraficoBarras({
  datos,
  titulo,
}: {
  datos: { nombre: string; valor: number }[];
  titulo: string;
}) {
  if (datos.length === 0) return null;
  return (
    <figure className="tarjeta mb-4 p-3">
      <figcaption className="mb-2 text-sm font-semibold">{titulo}</figcaption>
      <div aria-hidden style={{ height: Math.max(160, datos.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* accessibilityLayer=false: sin ella, Recharts pone su propio
              role="application" tabindex="0" en el <svg> para navegarlo con
              teclado, y ese foco queda ATRAPADO dentro de un contenedor
              aria-hidden (axe: aria-hidden-focus). El gráfico ya es
              decorativo a propósito — la tabla de al lado es la vía
              accesible — así que no hace falta una capa de teclado propia. */}
          <BarChart
            data={datos}
            layout="vertical"
            margin={{ left: 8, right: 48 }}
            accessibilityLayer={false}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(v) => formatearSoles(Number(v))}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="valor" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={28}>
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(v: unknown) => formatearSoles(Number(v))}
                style={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
