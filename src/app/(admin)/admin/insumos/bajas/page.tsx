import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { ResolverBaja } from "@/components/panel/resolver-baja";
import { aprobarBaja, rechazarBaja } from "@/lib/acciones/bajas";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_MOTIVO } from "@/lib/insumos/kardex";
import { formatearCantidad } from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const ESTADO = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" } as const;

export default function Bajas() {
  return (
    <>
      <EncabezadoPanel
        titulo="Bajas"
        volver={{ ruta: "/admin/insumos", nombre: "Insumos" }}
        accion={
          <Link href="/admin/insumos/bajas/nueva" className="boton-cta">
            <Plus aria-hidden className="size-5" /> Pedir baja
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <Listas />
      </Suspense>
    </>
  );
}

async function Listas() {
  const sesion = await exigirAcceso("/admin/insumos/bajas");
  const esAdministracion = sesion.rol === "superadmin" || sesion.rol === "administrador";
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("solicitudes_baja")
    .select(
      "id, cantidad, motivo_baja, observacion, estado, comentario_rechazo, created_at, solicitado_por, insumos(nombre), unidades_medida(codigo)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return <p role="alert">No se pudieron cargar las bajas. Recarga la página.</p>;

  const describir = (b: (typeof data)[number]) =>
    `${formatearCantidad(Number(b.cantidad))} ${b.unidades_medida?.codigo ?? ""} de ${b.insumos?.nombre ?? ""}`;
  const pendientes = data.filter((b) => b.estado === "pendiente");
  const resto = esAdministracion
    ? data.filter((b) => b.estado !== "pendiente")
    : data.filter((b) => b.solicitado_por === sesion.usuarioId);

  return (
    <>
      {esAdministracion ? (
        <section aria-labelledby="por-aprobar" className="mb-6">
          <h2 id="por-aprobar" className="mb-2 font-semibold">
            Por aprobar
          </h2>
          {pendientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay bajas esperando.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendientes.map((b) => (
                <li
                  key={b.id}
                  className="bg-card flex flex-col gap-2 rounded-xl border p-3"
                  data-baja={b.id}
                >
                  <p className="font-semibold">{describir(b)}</p>
                  <p className="text-sm">
                    {NOMBRE_MOTIVO[b.motivo_baja]} · {b.observacion}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Pedida el {formatearFechaLima(b.created_at)}
                  </p>
                  <ResolverBaja
                    descripcion={describir(b)}
                    aprobar={aprobarBaja.bind(null, b.id)}
                    rechazar={rechazarBaja.bind(null, b.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="historial">
        <h2 id="historial" className="mb-2 font-semibold">
          {esAdministracion ? "Resueltas" : "Tus bajas"}
        </h2>
        {resto.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay ninguna.</p>
        ) : (
          <ul
            aria-label={esAdministracion ? "Bajas resueltas" : "Tus bajas"}
            className="flex flex-col gap-2"
          >
            {resto.map((b) => (
              <li key={b.id} className="bg-card flex flex-col gap-1 rounded-xl border p-3 text-sm">
                <p className="font-semibold">{describir(b)}</p>
                <p>
                  {ESTADO[b.estado as keyof typeof ESTADO]} · {NOMBRE_MOTIVO[b.motivo_baja]} ·{" "}
                  {formatearFechaLima(b.created_at)}
                </p>
                {b.comentario_rechazo ? <p>Comentario: {b.comentario_rechazo}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
