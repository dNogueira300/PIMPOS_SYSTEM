"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import { FormularioPanel, useFormularioPanel } from "@/components/panel/formulario-panel";
import { FotosCliente } from "@/components/panel/fotos-cliente";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { buscarCelularRepetido, editarCliente, registrarCliente } from "@/lib/acciones/clientes";
import type { FichaCliente } from "@/lib/clientes/datos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCliente } from "@/lib/validaciones/cliente";

type Props = {
  cliente: FichaCliente | null;
  zonas: { id: string; nombre: string }[];
  /** El texto del permiso ya con el número del negocio (`textoDelPermiso`). */
  textoPermiso: string;
  pestana?: string;
};

export function FormularioCliente({ cliente, zonas, textoPermiso, pestana }: Props) {
  const [repetido, setRepetido] = useState<{
    id: string;
    nombre: string;
    zona: string | null;
  } | null>(null);
  const volver = cliente ? `/admin/clientes/${cliente.id}` : "/admin/clientes";

  return (
    <FormularioPanel
      clave={claveDeBorrador("cliente", cliente?.id ?? null)}
      accion={cliente ? editarCliente : registrarCliente}
      validar={validarCliente}
      destino={(id) =>
        cliente ? `/admin/clientes/${cliente.id}` : `/admin/clientes/${id}/editar?pestana=fotos`
      }
    >
      {cliente ? <input type="hidden" name="id" value={cliente.id} /> : null}
      <PestanasFormulario
        inicial={pestana}
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: [
              "nombre_completo",
              "celular",
              "direccion",
              "referencia",
              "zona_id",
              "observacion",
            ],
            contenido: (
              <>
                <Campo nombre="nombre_completo" etiqueta="Nombre y apellido">
                  {(p) => (
                    <input
                      {...p}
                      defaultValue={cliente?.nombre_completo ?? ""}
                      autoComplete="off"
                    />
                  )}
                </Campo>
                <Campo nombre="celular" etiqueta="Celular">
                  {(p) => (
                    <input
                      {...p}
                      inputMode="tel"
                      defaultValue={cliente?.celular ?? ""}
                      onBlur={async (e) =>
                        setRepetido(
                          await buscarCelularRepetido(e.currentTarget.value, cliente?.id ?? null),
                        )
                      }
                    />
                  )}
                </Campo>
                {repetido ? (
                  <p
                    role="status"
                    className="bg-muted rounded-md p-3 text-sm"
                    data-celular-repetido
                  >
                    Este celular ya es de {repetido.nombre}
                    {repetido.zona ? ` (${repetido.zona})` : ""}.{" "}
                    <Link href={`/admin/clientes/${repetido.id}`} className="underline">
                      Ver su ficha
                    </Link>
                    . Si es otra persona con el mismo número, puedes seguir.
                  </p>
                ) : null}
                <Campo nombre="direccion" etiqueta="Dirección">
                  {(p) => <input {...p} defaultValue={cliente?.direccion ?? ""} />}
                </Campo>
                <Campo
                  nombre="referencia"
                  etiqueta="Referencia"
                  ayuda="Cómo reconocer la casa: color del portón, qué hay al frente."
                >
                  {(p) => <input {...p} defaultValue={cliente?.referencia ?? ""} />}
                </Campo>
                <Campo nombre="zona_id" etiqueta="Zona">
                  {(p) => (
                    <select {...p} defaultValue={cliente?.zona_id ?? ""}>
                      <option value="">Elige…</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="observacion" etiqueta="Observación" opcional>
                  {(p) => <textarea {...p} rows={2} defaultValue={cliente?.observacion ?? ""} />}
                </Campo>
              </>
            ),
          },
          {
            valor: "fotos",
            titulo: "Ubicación y fotos",
            campos: ["coordenadas"],
            contenido: (
              <>
                <SelectorUbicacion
                  opcional
                  instruccion="Si sabes dónde está la casa, tócala en el mapa o usa tu ubicación. Si no, déjalo: basta la dirección."
                  inicial={
                    cliente?.latitud !== null &&
                    cliente?.latitud !== undefined &&
                    cliente.longitud !== null
                      ? { lat: cliente.latitud, lng: cliente.longitud }
                      : null
                  }
                />
                <FotosCliente
                  clienteId={cliente?.id ?? null}
                  fotos={cliente?.fotos ?? []}
                  puedeQuitar
                />
              </>
            ),
          },
          {
            valor: "permiso",
            titulo: "Permiso",
            campos: ["permiso"],
            contenido: cliente ? (
              <p className="text-sm">
                {cliente.permiso
                  ? `Aceptó el texto ${cliente.permiso.texto_version}. El permiso no se vuelve a pedir al editar.`
                  : "Sin permiso vigente."}
              </p>
            ) : (
              <>
                <p
                  className="bg-card rounded-md border p-4 text-lg leading-relaxed"
                  data-texto-permiso
                >
                  {textoPermiso}
                </p>
                <CasillaPermiso />
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver={volver} />
    </FormularioPanel>
  );
}

/** Una casilla de verdad, de 44 px, con su error debajo (el patrón de `Interruptor`). */
function CasillaPermiso() {
  const id = useId();
  const { errores } = useFormularioPanel();
  const error = errores.permiso?.[0];
  return (
    <div className="flex flex-col gap-1.5" data-campo="permiso">
      <label htmlFor={id} className="flex min-h-12 items-center gap-3 font-semibold">
        <input
          id={id}
          name="permiso"
          type="checkbox"
          className="accent-primary size-11 shrink-0"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        Se lo leí y aceptó
      </label>
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
