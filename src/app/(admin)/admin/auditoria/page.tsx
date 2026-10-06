import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { FiltrosHistorial } from "@/components/panel/filtros-historial";
import { ListaDeCambios } from "@/components/panel/lista-de-cambios";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { type Dueno, HIJOS_DE, SECCIONES } from "@/lib/auditoria/catalogo";
import { leerCambios, personasDelPanel, resolverNombres } from "@/lib/auditoria/datos";
import { aParametros, leerFiltros, MAXIMO, POR_PAGINA } from "@/lib/auditoria/filtros";
import { hoyEnLima } from "@/lib/insumos/periodo";

const RUTA = "/admin/auditoria";
const COSA: Readonly<Record<Dueno, string>> = {
  producto: "el producto",
  insumo: "el insumo",
  cliente: "el cliente",
};

export default function Historial({ searchParams }: PageProps<"/admin/auditoria">) {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Quién cambió qué en el panel, y cuándo. Nadie puede editarlo ni borrarlo."
      />
      <PestanasHistorial activa="cambios" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Cambios searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Cambios({ searchParams }: Pick<PageProps<"/admin/auditoria">, "searchParams">) {
  const [params] = await Promise.all([searchParams, exigirAcceso(RUTA)]);
  // `new Date()` dentro de un componente dinámico (ya leyó `searchParams` y la sesión).
  const ahora = new Date();
  const filtros = leerFiltros(params, ahora);
  const [resultado, personas] = await Promise.all([leerCambios(filtros), personasDelPanel()]);
  // «Ver historial» de un registro: se dice de quién es, con su nombre. Se
  // pide aparte: con muchos movimientos, la fila del propio registro puede no
  // estar en esta página.
  const dueno = filtros.registro;
  const nombres = resultado
    ? await resolverNombres(
        resultado.cambios,
        dueno ? { [HIJOS_DE[dueno.de].tabla.replace(/^public\./, "")]: [dueno.id] } : {},
      )
    : {};
  const hoy = hoyEnLima(ahora);
  const deQuien = dueno
    ? nombres[dueno.id]
      ? `${COSA[dueno.de]} ${nombres[dueno.id]}`
      : `un ${dueno.de}`
    : null;

  return (
    <>
      {filtros.registro ? (
        <p className="bg-muted mb-4 rounded-xl p-3 text-sm" data-de-un-registro>
          Historial de {deQuien}, con todo lo que cuelga de él.{" "}
          <Link href={RUTA} className="underline">
            Ver todo el historial
          </Link>
        </p>
      ) : null}

      <FiltrosHistorial
        personas={personas.map((p) => ({ valor: p.id, nombre: p.nombre }))}
        secciones={filtros.registro ? undefined : SECCIONES}
        conHizo
        conSistema
        valores={{
          persona: filtros.persona ?? "",
          seccion: filtros.seccion ?? "",
          hizo: filtros.hizo ?? "",
          cuando: filtros.cuando,
          desde: filtros.periodo?.desde ?? hoy,
          hasta: filtros.periodo?.hasta ?? hoy,
        }}
        conservar={
          filtros.registro ? { registro: filtros.registro.id, de: filtros.registro.de } : {}
        }
      />

      {resultado === null ? (
        <p role="alert">No se pudo cargar el historial. Recarga la página.</p>
      ) : resultado.cambios.length === 0 ? (
        <p className="bg-card rounded-xl border p-6 text-center">
          {resultado.hayMas
            ? "En lo más reciente no hay cambios que enseñar. Puede haber más abajo."
            : "No hay cambios con esos filtros. Prueba con un periodo más largo."}
        </p>
      ) : (
        <ListaDeCambios
          cambios={resultado.cambios}
          nombres={nombres}
          etiqueta="Cambios en el panel"
        />
      )}
      {resultado?.hayMas && filtros.ver < MAXIMO ? (
        <p className="mt-4">
          <Link
            href={`${RUTA}?${aParametros(filtros, { ver: filtros.ver + POR_PAGINA })}`}
            className="boton-linea"
            scroll={false}
          >
            Ver más
          </Link>
        </p>
      ) : null}
      {resultado?.hayMas && filtros.ver >= MAXIMO ? (
        <p className="text-muted-foreground mt-4 text-sm" data-tope>
          Se muestran los {MAXIMO} más recientes. Acota el periodo o elige una persona o una sección
          para ver los demás.
        </p>
      ) : null}
    </>
  );
}
