import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { describirDocumento, MAXIMO_INGRESOS, resumenIngresos } from "@/lib/insumos/ingresos";
import { leerPeriodo, periodoNombrado, type Periodo } from "@/lib/insumos/periodo";
import { formatearCantidad, nombreDeUnidad } from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/insumos/ingresos";
const CLASE_CONTROL = "border-input bg-card min-h-11 rounded-xl border px-3";

/**
 * Historial de ingresos (pedido de Dan, 19/11/2026): cada compra registrada,
 * una por fila, con su fecha, para responder «¿cuándo compramos bolsas?» sin
 * abrir el kárdex de cada insumo. Se filtra por insumo, proveedor y periodo; los
 * filtros viven en la dirección, como en los reportes, así que se puede
 * recargar o compartir. Lee la vista `ingresos_insumo` (0046).
 */
export default function HistorialIngresos({ searchParams }: PageProps<"/admin/insumos/ingresos">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial de ingresos"
        descripcion="Cada compra registrada, con su fecha. Filtra por insumo, proveedor o fechas."
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: PageProps<"/admin/insumos/ingresos">["searchParams"];
}) {
  const filtros = await searchParams;
  await exigirAcceso(RUTA);

  // Dentro de un componente dinámico (espera la sesión): aquí `new Date()` no
  // rompe el prerenderizado (trampa de Cache Components en AGENTS.md).
  const ahora = new Date();
  const periodo = leerPeriodo(filtros, ahora, 90);
  const insumo = typeof filtros.insumo === "string" ? filtros.insumo : "";
  const proveedor = typeof filtros.proveedor === "string" ? filtros.proveedor : "";

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("ingresos_insumo")
    .select(
      "id, ocurrido_en, insumo_id, insumo, cantidad, unidad, proveedor, documento_tipo, documento_numero, fecha_vencimiento, responsable, anulado",
    )
    .gte("dia", periodo.desde)
    .lte("dia", periodo.hasta)
    .order("ocurrido_en", { ascending: false })
    .order("secuencia", { ascending: false })
    .limit(MAXIMO_INGRESOS + 1);
  if (insumo) consulta = consulta.eq("insumo_id", insumo);
  if (proveedor) consulta = consulta.eq("proveedor_id", proveedor);

  const [{ data, error }, { data: insumos }, { data: proveedores }] = await Promise.all([
    consulta,
    supabase.from("insumos").select("id, nombre").is("deleted_at", null).order("nombre"),
    supabase.from("proveedores").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  // Las columnas de una vista salen nullables en los tipos generados; se
  // normalizan aquí, nunca con `!`.
  const todas = (data ?? []).map((m) => ({
    id: m.id ?? "",
    ocurrido_en: m.ocurrido_en ?? "",
    insumo_id: m.insumo_id ?? "",
    insumo: m.insumo ?? "",
    cantidad: Number(m.cantidad ?? 0),
    unidad: m.unidad ?? "",
    proveedor: m.proveedor ?? "",
    documento: describirDocumento(m.documento_tipo, m.documento_numero),
    fecha_vencimiento: m.fecha_vencimiento,
    responsable: m.responsable ?? "",
    anulado: m.anulado ?? false,
  }));
  const hayMas = todas.length > MAXIMO_INGRESOS;
  const filas = todas.slice(0, MAXIMO_INGRESOS);
  const validos = filas.filter((f) => !f.anulado).length;

  const enlace = (p: Periodo) =>
    `${RUTA}?${new URLSearchParams({
      ...(insumo ? { insumo } : {}),
      ...(proveedor ? { proveedor } : {}),
      ...p,
    }).toString()}`;

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={enlace(periodoNombrado("semana", ahora))} className="boton-linea">
          Esta semana
        </Link>
        <Link href={enlace(periodoNombrado("mes", ahora))} className="boton-linea">
          Este mes
        </Link>
      </div>
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Insumo</span>
          <select name="insumo" defaultValue={insumo} className={CLASE_CONTROL}>
            <option value="">Todos</option>
            {(insumos ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Proveedor</span>
          <select name="proveedor" defaultValue={proveedor} className={CLASE_CONTROL}>
            <option value="">Todos</option>
            {(proveedores ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Desde</span>
          <input type="date" name="desde" defaultValue={periodo.desde} className={CLASE_CONTROL} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Hasta</span>
          <input type="date" name="hasta" defaultValue={periodo.hasta} className={CLASE_CONTROL} />
        </label>
        <button type="submit" className="boton-cta">
          Filtrar
        </button>
      </form>

      {error ? (
        <p role="alert">No se pudo cargar el historial de ingresos. Recarga la página.</p>
      ) : (
        <>
          <p className="text-muted-foreground mb-2 text-sm">
            {resumenIngresos(validos, filas.length - validos, periodo)}
          </p>
          <ListaAdaptable
            etiqueta="Historial de ingresos"
            filas={filas}
            enlace={(m) => `/admin/insumos/${m.insumo_id}`}
            columnas={[
              {
                titulo: "Fecha",
                principal: true,
                celda: (m) => {
                  const texto = `${formatearFechaLima(m.ocurrido_en)} · ${m.insumo}`;
                  return m.anulado ? (
                    <>
                      <s>{texto}</s> <span className="text-muted-foreground">(anulado)</span>
                    </>
                  ) : (
                    texto
                  );
                },
              },
              {
                titulo: "Cantidad",
                celda: (m) =>
                  `${formatearCantidad(m.cantidad)} ${nombreDeUnidad(m.unidad, m.cantidad)}`,
              },
              { titulo: "Proveedor", celda: (m) => m.proveedor },
              { titulo: "Documento", celda: (m) => m.documento },
              {
                titulo: "Vence",
                celda: (m) =>
                  m.fecha_vencimiento
                    ? `Vence el ${m.fecha_vencimiento.split("-").reverse().join("/")}`
                    : "No vence",
              },
              { titulo: "Registró", celda: (m) => m.responsable },
            ]}
            vacio={
              <p>
                No hay ingresos registrados entre esas fechas. Prueba con otro periodo u otro
                insumo.
              </p>
            }
          />
          {hayMas ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Se muestran los {MAXIMO_INGRESOS} más recientes. Acorta las fechas o elige un insumo
              para ver los anteriores.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
