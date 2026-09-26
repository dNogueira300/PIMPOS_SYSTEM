import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnularMovimiento } from "@/components/panel/anular-movimiento";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaInsumo } from "@/components/panel/etiqueta-insumo";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { anularMovimiento } from "@/lib/acciones/kardex";
import { exigirAcceso } from "@/lib/auth/sesion";
import { detalleDeMovimiento, NOMBRE_TIPO } from "@/lib/insumos/kardex";
import { leerPeriodo } from "@/lib/insumos/periodo";
import {
  describirExistencia,
  formatearCantidad,
  presentacionPrincipal,
} from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export default function FichaInsumo({ params, searchParams }: PageProps<"/admin/insumos/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Ficha params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Ficha({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/insumos/[id]">["params"];
  searchParams: PageProps<"/admin/insumos/[id]">["searchParams"];
}) {
  const [{ id }, filtros] = await Promise.all([params, searchParams]);
  const sesion = await exigirAcceso("/admin/insumos");
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  // Dentro de un componente dinámico (espera la sesión): aquí `new Date()` no
  // rompe el prerenderizado (trampa de Cache Components en CLAUDE.md).
  const periodo = leerPeriodo(filtros, new Date(), 30);

  const supabase = await crearClienteServidor();
  const [{ data: insumo }, { data: equivalencias }, { data: lotes }, { data: kardex, error }] =
    await Promise.all([
      supabase.from("existencias_insumo").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("equivalencias")
        .select("factor, unidades_medida!unidad_desde(codigo)")
        .eq("insumo_id", id),
      supabase
        .from("saldos_lote")
        .select("cantidad_base, lotes_insumo(codigo, fecha_vencimiento, costo_unitario)")
        .eq("insumo_id", id)
        .gt("cantidad_base", 0),
      supabase.rpc("kardex_insumo", {
        p_insumo: id,
        p_desde: periodo.desde,
        p_hasta: periodo.hasta,
      }),
    ]);
  if (!insumo) notFound();

  const presentacion = presentacionPrincipal(
    (equivalencias ?? [])
      .filter((e) => e.unidades_medida)
      .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
  );
  const filas = (kardex ?? []).slice().reverse(); // lo más reciente arriba

  return (
    <>
      <EncabezadoPanel
        titulo={insumo.nombre ?? ""}
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href={`/admin/insumos/${id}/editar`} className="boton-linea">
            <Pencil aria-hidden className="size-5" /> Editar datos
          </Link>
        }
      />
      <section aria-labelledby="hay" className="tarjeta mb-6 p-4">
        <h2 id="hay" className="text-muted-foreground text-sm">
          Hay en el almacén
        </h2>
        <p className="text-2xl font-semibold">
          {describirExistencia(
            Number(insumo.cantidad_base ?? 0),
            insumo.unidad_base ?? "",
            presentacion,
          )}
        </p>
        <p className="mt-1 flex gap-1">
          {insumo.bajo_minimo ? <EtiquetaInsumo tipo="bajo" /> : null}
          {insumo.por_vencer ? <EtiquetaInsumo tipo="vencer" /> : null}
        </p>
      </section>

      {lotes && lotes.length > 0 ? (
        <section aria-labelledby="lotes" className="mb-6">
          <h2 id="lotes" className="mb-2 font-semibold">
            Lotes con existencia
          </h2>
          <ul className="flex flex-col gap-2">
            {lotes.map((l, i) => (
              <li
                key={i}
                className="bg-card flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm"
              >
                <span>{l.lotes_insumo?.codigo ?? "Sin código"}</span>
                <span>
                  {l.lotes_insumo?.fecha_vencimiento
                    ? `Vence el ${l.lotes_insumo.fecha_vencimiento.split("-").reverse().join("/")}`
                    : "No vence"}
                </span>
                <span>
                  Quedan {formatearCantidad(Number(l.cantidad_base))} {insumo.unidad_base}
                </span>
                <span>
                  {l.lotes_insumo?.costo_unitario != null
                    ? `S/ ${Number(l.lotes_insumo.costo_unitario).toFixed(2)} el ${insumo.unidad_base}`
                    : "Costo sin registrar"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="kardex">
        <h2 id="kardex" className="mb-2 font-semibold">
          Movimientos
        </h2>
        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={periodo.desde}
              className="border-input bg-card min-h-11 rounded-xl border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={periodo.hasta}
              className="border-input bg-card min-h-11 rounded-xl border px-3"
            />
          </label>
          <button type="submit" className="boton-linea">
            Ver
          </button>
        </form>
        {error ? (
          <p role="alert">No se pudo cargar el kárdex. Recarga la página.</p>
        ) : (
          <ListaAdaptable
            etiqueta={`Movimientos de ${insumo.nombre}`}
            filas={filas}
            enlace={() => `/admin/insumos/${id}`}
            columnas={[
              {
                titulo: "Movimiento",
                principal: true,
                celda: (m) => {
                  const texto = `${NOMBRE_TIPO[m.tipo] ?? m.tipo} · ${formatearFechaLima(m.ocurrido_en)}`;
                  return m.anulado ? (
                    <>
                      <s>{texto}</s> <span className="text-muted-foreground">(anulado)</span>
                    </>
                  ) : (
                    texto
                  );
                },
              },
              { titulo: "Detalle", celda: (m) => detalleDeMovimiento(m) },
              {
                titulo: "Cantidad",
                celda: (m) =>
                  `${m.sentido > 0 ? "+" : "−"}${formatearCantidad(Number(m.cantidad_base))} ${insumo.unidad_base}`,
              },
              {
                titulo: "Queda",
                celda: (m) => `${formatearCantidad(Number(m.saldo))} ${insumo.unidad_base}`,
              },
              { titulo: "Registró", celda: (m) => m.responsable ?? "" },
            ]}
            acciones={
              esAdministracion
                ? (m) =>
                    m.anulado || m.tipo === "anulacion" ? null : (
                      <AnularMovimiento
                        descripcion={`el ${(NOMBRE_TIPO[m.tipo] ?? m.tipo).toLowerCase()} del ${formatearFechaLima(m.ocurrido_en)}`}
                        accion={anularMovimiento.bind(null, m.id)}
                      />
                    )
                : undefined
            }
            vacio={<p>No hay movimientos entre esas fechas.</p>}
          />
        )}
      </section>
    </>
  );
}
