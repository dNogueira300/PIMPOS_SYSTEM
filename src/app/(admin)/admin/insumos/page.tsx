import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { EtiquetaInsumo } from "@/components/panel/etiqueta-insumo";
import { ListaAdaptable } from "@/components/panel/lista-adaptable";
import { exigirAcceso } from "@/lib/auth/sesion";
import { describirExistencia, presentacionPrincipal } from "@/lib/insumos/unidades";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const RUTA = "/admin/insumos";

/**
 * Lo que se puede registrar desde aquí. Cada tarea añade su entrada: T3
 * ingreso y consumo, T4 conteo (solo administración), T5 pedir baja.
 */
const REGISTRAR: ReadonlyArray<{ ruta: string; nombre: string; soloAdministracion?: boolean }> = [
  { ruta: "/admin/insumos/ingreso", nombre: "Registrar ingreso" },
  { ruta: "/admin/insumos/consumo", nombre: "Registrar consumo" },
];

export default function Existencias({ searchParams }: PageProps<"/admin/insumos">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Insumos"
        descripcion="Cuánto hay de cada insumo en el almacén."
        accion={
          <Link href={`${RUTA}/nuevo`} className="boton-linea">
            <Plus aria-hidden className="size-5" /> Nuevo insumo
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Lista({
  searchParams,
}: {
  searchParams: PageProps<"/admin/insumos">["searchParams"];
}) {
  const { buscar, ver } = await searchParams;
  const sesion = await exigirAcceso(RUTA);
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("existencias_insumo")
    .select("id, nombre, unidad_base, cantidad_base, bajo_minimo, por_vencer, proximo_vencimiento")
    .eq("activo", true)
    .order("nombre");
  if (typeof buscar === "string" && buscar.trim() !== "") {
    consulta = consulta.ilike("nombre", `%${buscar.trim()}%`);
  }
  if (ver === "bajo") consulta = consulta.eq("bajo_minimo", true);
  if (ver === "vencer") consulta = consulta.eq("por_vencer", true);

  const [{ data, error }, { data: equivalencias }] = await Promise.all([
    consulta,
    supabase
      .from("equivalencias")
      .select("insumo_id, factor, unidades_medida!unidad_desde(codigo)"),
  ]);

  if (error) {
    return <p role="alert">No se pudieron cargar las existencias. Recarga la página.</p>;
  }

  // Las columnas de una vista salen siempre nullable en los tipos generados
  // (PostgREST no sabe demostrar que nunca lo son); se normalizan aquí, como
  // en `src/lib/datos/catalogo.ts`.
  const filas = data.map((i) => ({
    id: i.id ?? "",
    nombre: i.nombre ?? "",
    unidad_base: i.unidad_base ?? "",
    cantidad_base: i.cantidad_base ?? 0,
    bajo_minimo: i.bajo_minimo ?? false,
    por_vencer: i.por_vencer ?? false,
  }));

  const presentacion = (insumoId: string) =>
    presentacionPrincipal(
      (equivalencias ?? [])
        .filter((e) => e.insumo_id === insumoId && e.unidades_medida)
        .map((e) => ({ codigo: e.unidades_medida!.codigo, factor: Number(e.factor) })),
    );

  const acciones = REGISTRAR.filter((a) => !a.soloAdministracion || esAdministracion);

  return (
    <>
      {acciones.length > 0 ? (
        <nav aria-label="Registrar" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {acciones.map((a) => (
            <Link key={a.ruta} href={a.ruta} className="boton-cta justify-center">
              {a.nombre}
            </Link>
          ))}
        </nav>
      ) : null}

      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="buscar">
          Buscar insumo
        </label>
        <input
          id="buscar"
          name="buscar"
          defaultValue={typeof buscar === "string" ? buscar : ""}
          placeholder="Buscar insumo"
          className="border-input bg-card min-h-11 flex-1 rounded-xl border px-3"
        />
        <label className="sr-only" htmlFor="ver">
          Mostrar
        </label>
        <select
          id="ver"
          name="ver"
          defaultValue={typeof ver === "string" ? ver : ""}
          className="border-input bg-card min-h-11 rounded-xl border px-3"
        >
          <option value="">Todos</option>
          <option value="bajo">Bajo el mínimo</option>
          <option value="vencer">Por vencer</option>
        </select>
        <button type="submit" className="boton-linea">
          Buscar
        </button>
      </form>

      <ListaAdaptable
        etiqueta="Existencias de insumos"
        filas={filas}
        enlace={(i) => `${RUTA}/${i.id}/editar`}
        columnas={[
          { titulo: "Insumo", celda: (i) => i.nombre, principal: true },
          {
            titulo: "Hay",
            celda: (i) =>
              describirExistencia(Number(i.cantidad_base), i.unidad_base, presentacion(i.id)),
          },
          {
            titulo: "Avisos",
            celda: (i) => (
              <span className="flex flex-wrap gap-1">
                {i.bajo_minimo ? <EtiquetaInsumo tipo="bajo" /> : null}
                {i.por_vencer ? <EtiquetaInsumo tipo="vencer" /> : null}
              </span>
            ),
          },
        ]}
        vacio={<p>No hay insumos que coincidan. Prueba con otra palabra o crea uno nuevo.</p>}
      />
      <p className="mt-4 text-sm">
        <Link href={`${RUTA}/proveedores`} className="inline-flex min-h-11 items-center underline">
          Proveedores
        </Link>
      </p>
    </>
  );
}
