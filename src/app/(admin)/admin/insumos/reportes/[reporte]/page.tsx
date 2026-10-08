import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { GraficoBarras } from "@/components/panel/grafico-barras";
import { SelectorPeriodo } from "@/components/panel/selector-periodo";
import { TablaReporte } from "@/components/panel/tabla-reporte";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerPeriodo, periodoNombrado } from "@/lib/insumos/periodo";
import { esSlugReporte, leerReporte, REPORTES } from "@/lib/insumos/reportes";
import { crearClienteServidor } from "@/lib/supabase/servidor";

type Props = PageProps<"/admin/insumos/reportes/[reporte]">;

export default function PaginaReporte({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ params, searchParams }: Props) {
  const [{ reporte: slug }, filtros] = await Promise.all([params, searchParams]);
  if (!esSlugReporte(slug)) notFound();
  await exigirAcceso(`/admin/insumos/reportes/${slug}`);

  const ahora = new Date();
  const periodo = leerPeriodo(filtros, ahora, 30);
  const insumo = typeof filtros.insumo === "string" ? filtros.insumo : undefined;
  const reporte = await leerReporte(slug, periodo, insumo);
  const ruta = `/admin/insumos/reportes/${slug}`;

  let insumos: { id: string; nombre: string }[] = [];
  if (slug === "kardex") {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("insumos")
      .select("id, nombre")
      .is("deleted_at", null)
      .order("nombre");
    insumos = data ?? [];
  }

  return (
    <>
      <EncabezadoPanel
        titulo={reporte.titulo}
        descripcion={`${REPORTES[slug].descripcion} ${reporte.subtitulo}.`}
        volver={{ ruta: "/admin/insumos/reportes", nombre: "Reportes" }}
      />
      {slug === "kardex" ? (
        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Insumo</span>
            <select
              name="insumo"
              defaultValue={insumo ?? ""}
              className="border-input bg-card min-h-11 rounded-md border px-3"
            >
              <option value="">Elige…</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="desde" value={periodo.desde} />
          <input type="hidden" name="hasta" value={periodo.hasta} />
          <button type="submit" className="boton-linea">
            Ver
          </button>
        </form>
      ) : null}
      {REPORTES[slug].conPeriodo ? (
        <SelectorPeriodo
          ruta={ruta}
          periodo={periodo}
          semana={periodoNombrado("semana", ahora)}
          mes={periodoNombrado("mes", ahora)}
          extra={insumo ? { insumo } : undefined}
        />
      ) : null}
      {reporte.grafico ? (
        <GraficoBarras datos={reporte.grafico} titulo={`${reporte.titulo}, en soles`} />
      ) : null}
      {reporte.filas.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["excel", "pdf"] as const).map((formato) => (
            // Un <a> y no <Link>: es una descarga, no una navegación del panel.
            // Sin el atributo `download`: `Content-Disposition: attachment` ya la
            // descarga, y si la sesión se cerró el navegador sigue la redirección
            // a /ingresar en vez de guardar ese HTML como si fuera el archivo.
            <a
              key={formato}
              href={`${ruta}/${formato}?${new URLSearchParams({ ...periodo, ...(insumo ? { insumo } : {}) })}`}
              className="boton-linea"
            >
              Descargar {formato === "excel" ? "Excel" : "PDF"}
            </a>
          ))}
        </div>
      ) : null}
      <TablaReporte reporte={reporte} />
    </>
  );
}
