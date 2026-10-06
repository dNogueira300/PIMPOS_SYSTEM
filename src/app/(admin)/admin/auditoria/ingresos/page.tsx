import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { FiltrosHistorial } from "@/components/panel/filtros-historial";
import { PestanasHistorial } from "@/components/panel/pestanas-historial";
import { exigirAcceso } from "@/lib/auth/sesion";
import { leerIngresos, personasDelPanel } from "@/lib/auditoria/datos";
import { leerFiltros } from "@/lib/auditoria/filtros";
import { hoyEnLima } from "@/lib/insumos/periodo";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

type Props = PageProps<"/admin/auditoria/ingresos">;

export default function Ingresos({ searchParams }: Props) {
  return (
    <>
      <EncabezadoPanel
        titulo="Historial"
        descripcion="Quién entró al panel y quién salió. No se anotan los intentos con la contraseña equivocada."
      />
      <PestanasHistorial activa="ingresos" />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Lista({ searchParams }: Pick<Props, "searchParams">) {
  const [params] = await Promise.all([searchParams, exigirAcceso("/admin/auditoria")]);
  const ahora = new Date();
  const filtros = leerFiltros(params, ahora);
  const [ingresos, personas] = await Promise.all([leerIngresos(filtros), personasDelPanel()]);
  const hoy = hoyEnLima(ahora);

  return (
    <>
      <FiltrosHistorial
        personas={personas.map((p) => ({ valor: p.id, nombre: p.nombre }))}
        valores={{
          persona: filtros.persona === "sistema" ? "" : (filtros.persona ?? ""),
          cuando: filtros.cuando,
          desde: filtros.periodo?.desde ?? hoy,
          hasta: filtros.periodo?.hasta ?? hoy,
        }}
      />
      {ingresos === null ? (
        <p role="alert">No se pudieron cargar los ingresos. Recarga la página.</p>
      ) : ingresos.length === 0 ? (
        <p className="bg-card rounded-xl border p-6 text-center">
          Nadie entró ni salió en ese periodo. Prueba con uno más largo.
        </p>
      ) : (
        <>
          <ul aria-label="Ingresos y salidas" className="flex flex-col gap-2">
            {ingresos.map((i, n) => (
              <li
                key={`${i.ocurrido_en}-${i.usuario_id}-${n}`}
                className="bg-card flex flex-col gap-0.5 rounded-xl border p-3 wrap-anywhere"
              >
                <span>
                  <strong className="font-semibold">{i.quien}</strong>{" "}
                  {i.accion === "ingreso" ? "entró" : "salió"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatearFechaLima(i.ocurrido_en)}
                </span>
              </li>
            ))}
          </ul>
          {ingresos.length >= 500 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              Se muestran los 500 más recientes. Acota el periodo o elige una persona para ver los
              demás.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
