import { Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BotonActivoCliente } from "@/components/panel/boton-activo-cliente";
import { BotonesContacto } from "@/components/panel/botones-contacto";
import { EncabezadoPanel } from "@/components/panel/encabezado-panel";
import { exigirAcceso } from "@/lib/auth/sesion";
import { celularParaLeer } from "@/lib/clientes/contacto";
import { leerFicha } from "@/lib/clientes/datos";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

const Mapa = dynamic(() => import("@/components/publico/mapa").then((m) => m.Mapa));

type Props = PageProps<"/admin/clientes/[id]">;

export default function FichaDeCliente({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<Props, "params">) {
  const [{ id }, sesion] = await Promise.all([params, exigirAcceso("/admin/clientes")]);
  const cliente = await leerFicha(id);
  if (!cliente) notFound();
  const encargado = sesion.rol !== "repartidor";

  return (
    <>
      <EncabezadoPanel
        titulo={cliente.nombre_completo}
        descripcion={cliente.activo ? undefined : "Desactivado: no sale en la lista ni en el mapa."}
        volver={{ ruta: "/admin/clientes", nombre: "Clientes" }}
        accion={
          cliente.borrado ? null : (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/clientes/${id}/${encargado ? "editar" : "corregir"}`}
                className="boton-linea"
              >
                <Pencil aria-hidden className="size-5" />
                {encargado ? "Editar datos" : "Corregir ubicación y fotos"}
              </Link>
              {encargado ? <BotonActivoCliente id={id} activo={cliente.activo} /> : null}
            </div>
          )
        }
      />

      {cliente.borrado ? (
        <p className="bg-card rounded-xl border p-4">
          Los datos de este cliente se borraron a su pedido. Solo queda la constancia.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <BotonesContacto
              grande
              nombre={cliente.nombre_completo}
              celular={cliente.celular}
              latitud={cliente.latitud}
              longitud={cliente.longitud}
            />
          </div>

          <section aria-labelledby="datos" className="tarjeta mb-6 p-4">
            <h2 id="datos" className="mb-2 font-semibold">
              Datos
            </h2>
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Celular</dt>
              <dd>{celularParaLeer(cliente.celular)}</dd>
              <dt className="text-muted-foreground">Dirección</dt>
              <dd>{cliente.direccion}</dd>
              <dt className="text-muted-foreground">Referencia</dt>
              <dd>{cliente.referencia ?? "—"}</dd>
              <dt className="text-muted-foreground">Zona</dt>
              <dd>{cliente.zona ?? "Sin zona"}</dd>
              {cliente.observacion ? (
                <>
                  <dt className="text-muted-foreground">Observación</dt>
                  <dd>{cliente.observacion}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="fotos" className="mb-6">
            <h2 id="fotos" className="mb-2 font-semibold">
              Fotos de la fachada
            </h2>
            {cliente.fotos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todavía no tiene fotos.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cliente.fotos.map((f) =>
                  f.url ? (
                    <li key={f.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de un bucket privado: next/image la guardaría en su caché, y caduca a los 10 minutos */}
                      <img
                        src={f.url}
                        alt={`Fachada de la casa, foto ${f.orden}`}
                        className="aspect-[4/3] w-full rounded-xl border object-cover"
                      />
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </section>

          <section aria-labelledby="ubicacion" className="mb-6">
            <h2 id="ubicacion" className="mb-2 font-semibold">
              Ubicación
            </h2>
            {cliente.latitud !== null && cliente.longitud !== null ? (
              <Mapa
                lat={cliente.latitud}
                lng={cliente.longitud}
                titulo={cliente.nombre_completo}
                direccion={cliente.direccion}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin punto en el mapa: se llega por la dirección y la referencia.
              </p>
            )}
          </section>

          <section aria-labelledby="permiso" className="mb-6">
            <h2 id="permiso" className="mb-2 font-semibold">
              Permiso para guardar sus datos
            </h2>
            {cliente.permiso ? (
              <p className="text-sm" data-permiso>
                Aceptó el texto {cliente.permiso.texto_version} el{" "}
                {formatearFechaLima(cliente.permiso.otorgado_en)}. Lo anotó{" "}
                {cliente.permiso.registrado_por}.
              </p>
            ) : (
              <p className="text-sm">Sin permiso vigente.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
