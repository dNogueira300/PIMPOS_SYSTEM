import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { NOMBRE_DEL_ROL, esRol } from "@/lib/auth/roles";
import { destinoDe, infoDeTabla } from "@/lib/auditoria/catalogo";
import { existeDestino, leerCambio, leerGuardado, resolverNombres } from "@/lib/auditoria/datos";
import { accion, diferencias, quien } from "@/lib/auditoria/redactar";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

type Props = PageProps<"/admin/auditoria/[id]">;

const OPERACION = {
  INSERT: "Alta (INSERT)",
  UPDATE: "Cambio (UPDATE)",
  DELETE: "Eliminación (DELETE)",
};

export default function UnCambio({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: Pick<Props, "params">) {
  const [{ id }] = await Promise.all([params, exigirAcceso("/admin/auditoria")]);
  // El número llega de la dirección: lo que no es un entero positivo no existe.
  if (!/^\d{1,15}$/.test(id)) notFound();
  const cambio = await leerCambio(Number(id));
  if (cambio === "error") {
    return (
      <>
        <EncabezadoPanel
          titulo="Un cambio"
          volver={{ ruta: "/admin/auditoria", nombre: "Historial" }}
        />
        <p role="alert">No se pudo cargar este cambio. Recarga la página.</p>
      </>
    );
  }
  if (!cambio) notFound();

  // Un «Guardar» deja varias filas sobre el mismo registro: lo que se enseña
  // es el guardado entero (lo mismo que dice su línea en la lista). El detalle
  // técnico, más abajo, sigue siendo el de esta fila.
  const { cambio: junto, filas } = await leerGuardado(cambio);
  const nombres = await resolverNombres([junto]);
  const info = infoDeTabla(cambio.tabla);
  const lista = diferencias(junto, nombres);
  // «Ir a…» solo si el registro sigue ahí: ni tras una eliminación o un
  // borrado, ni en una ficha con los datos borrados, ni si se borró DESPUÉS de
  // este cambio (eso se le pregunta a la base).
  const despues = cambio.datos_despues ?? {};
  const destino = destinoDe(cambio.tabla, despues);
  const yaNoEsta =
    cambio.operacion === "DELETE" ||
    despues.borrado === true ||
    (despues.deleted_at !== null && despues.deleted_at !== undefined) ||
    (destino !== null && !(await existeDestino(destino)));
  const ruta = yaNoEsta ? null : (info.ruta?.(despues) ?? null);
  const rol =
    cambio.usuario_id === null
      ? "Automático"
      : esRol(cambio.rol)
        ? NOMBRE_DEL_ROL[cambio.rol]
        : "Sin rol";

  return (
    <>
      <EncabezadoPanel
        titulo="Un cambio"
        volver={{ ruta: "/admin/auditoria", nombre: "Historial" }}
        accion={
          ruta ? (
            <Link href={ruta} className="boton-linea">
              Ir a donde se hizo
            </Link>
          ) : null
        }
      />

      <section aria-labelledby="que-paso" className="tarjeta mb-6 p-4">
        <h2 id="que-paso" className="sr-only">
          Qué pasó
        </h2>
        <p className="text-lg wrap-anywhere" data-frase>
          <strong className="font-semibold">{quien(junto)}</strong> {accion(junto, nombres)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {rol} · {formatearFechaLima(cambio.ocurrido_en)}
          {cambio.usuario_correo ? ` · ${cambio.usuario_correo}` : ""}
        </p>
      </section>

      <section aria-labelledby="que-cambio" className="mb-6">
        <h2 id="que-cambio" className="mb-3 text-xl font-semibold tracking-[-0.025em]">
          {cambio.operacion === "UPDATE"
            ? "Qué cambió"
            : cambio.operacion === "INSERT"
              ? "Con qué datos"
              : "Qué había"}
        </h2>
        {lista.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay datos que enseñar: no cambió ningún dato, o se borraron a pedido del cliente.
          </p>
        ) : (
          <dl className="bg-card divide-y rounded-md border" data-diferencias>
            {lista.map((d) => (
              <div
                key={d.campo}
                className="grid min-w-0 gap-2 p-4 sm:grid-cols-[12rem_minmax(0,1fr)]"
              >
                <dt className="text-muted-foreground text-sm">{d.etiqueta}</dt>
                <dd className="wrap-anywhere">
                  {cambio.operacion === "UPDATE" ? (
                    <>
                      <span className="text-muted-foreground line-through">{d.antes}</span>{" "}
                      <span aria-hidden>→</span>
                      <span className="sr-only"> pasó a </span> <span>{d.despues}</span>
                    </>
                  ) : cambio.operacion === "INSERT" ? (
                    d.despues
                  ) : (
                    d.antes
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <details className="bg-card rounded-md border p-3" data-detalle-tecnico>
        <summary className="min-h-11 cursor-pointer content-center font-semibold">
          Detalle técnico
        </summary>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">Número</dt>
          <dd>{cambio.id}</dd>
          {filas.length > 1 ? (
            <>
              <dt className="text-muted-foreground">Del mismo guardado</dt>
              <dd className="flex flex-wrap gap-x-3" data-mismo-guardado>
                {filas.map((n) =>
                  n === cambio.id ? (
                    <span key={n}>{n} (esta)</span>
                  ) : (
                    <Link key={n} href={`/admin/auditoria/${n}`} className="underline">
                      {n}
                    </Link>
                  ),
                )}
              </dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Tabla</dt>
          <dd>
            {cambio.tabla}
            {info.interna ? " (interna)" : ""}
          </dd>
          <dt className="text-muted-foreground">Operación</dt>
          <dd>{OPERACION[cambio.operacion]}</dd>
          <dt className="text-muted-foreground">Registro</dt>
          <dd className="wrap-anywhere">{cambio.registro_id ?? "—"}</dd>
        </dl>
        <h3 className="mt-3 text-sm font-semibold">Antes</h3>
        <pre className="bg-muted overflow-x-auto rounded-lg p-2 text-xs" tabIndex={0}>
          {cambio.datos_antes ? JSON.stringify(cambio.datos_antes, null, 2) : "—"}
        </pre>
        <h3 className="mt-3 text-sm font-semibold">Después</h3>
        <pre className="bg-muted overflow-x-auto rounded-lg p-2 text-xs" tabIndex={0}>
          {cambio.datos_despues ? JSON.stringify(cambio.datos_despues, null, 2) : "—"}
        </pre>
      </details>
    </>
  );
}
