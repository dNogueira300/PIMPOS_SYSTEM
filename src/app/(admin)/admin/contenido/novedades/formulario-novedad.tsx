"use client";

import Link from "next/link";

import { Campo } from "@/components/panel/campo";
import { FormularioPanel, useFormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarNovedad } from "@/lib/acciones/novedades";
import { NOMBRE_DE_TIPO, TIPOS_DE_NOVEDAD, type Intencion } from "@/lib/panel/aprobacion";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { utcALima } from "@/lib/panel/hora-lima";
import { validarNovedad } from "@/lib/validaciones/novedad";

export type NovedadEditable = {
  id: string;
  tipo: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_url: string | null;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  estado: string;
  comentario_revision: string | null;
};

const VOLVER = "/admin/contenido/novedades";

const TEXTO_BOTON: Record<Intencion, string> = {
  guardar: "Guardar",
  enviar: "Enviar a revisión",
  publicar: "Publicar",
  devolver: "Devolver con comentario",
  archivar: "Retirar del sitio",
};

type Props = { novedad: NovedadEditable | null; acciones: Intencion[] };

export function FormularioNovedad({ novedad, acciones }: Props) {
  const soloLectura = acciones.length === 0;

  return (
    <FormularioPanel
      clave={claveDeBorrador("novedad", novedad?.id ?? null)}
      accion={guardarNovedad}
      validar={validarNovedad}
      destino={() => VOLVER}
    >
      {novedad?.comentario_revision ? (
        <div role="note" className="bg-alerta/15 rounded-xl p-4" data-comentario-revision>
          <p className="font-semibold">Un administrador la devolvió con este comentario:</p>
          <p className="mt-1">{novedad.comentario_revision}</p>
        </div>
      ) : null}
      {soloLectura ? (
        <p role="status" className="bg-muted rounded-xl p-4" data-esperando-aprobacion>
          Esperando aprobación. Un administrador la revisará; mientras tanto no se puede editar.
        </p>
      ) : null}

      <input type="hidden" name="id" value={novedad?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "contenido",
            titulo: "Contenido",
            campos: ["tipo", "titulo", "resumen", "contenido"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <Campo nombre="tipo" etiqueta="Tipo">
                  {(p) => (
                    <select {...p} defaultValue={novedad?.tipo ?? ""}>
                      <option value="">Elige uno…</option>
                      {TIPOS_DE_NOVEDAD.map((t) => (
                        <option key={t} value={t}>
                          {NOMBRE_DE_TIPO[t]}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="titulo" etiqueta="Título">
                  {(p) => <input {...p} defaultValue={novedad?.titulo ?? ""} autoComplete="off" />}
                </Campo>
                <Campo
                  nombre="resumen"
                  etiqueta="Resumen"
                  ayuda="Una frase para la tarjeta de la portada."
                  opcional
                >
                  {(p) => <input {...p} defaultValue={novedad?.resumen ?? ""} />}
                </Campo>
                <Campo nombre="contenido" etiqueta="Texto">
                  {(p) => <textarea {...p} rows={6} defaultValue={novedad?.contenido ?? ""} />}
                </Campo>
              </fieldset>
            ),
          },
          {
            valor: "vigencia",
            titulo: "Vigencia",
            campos: ["vigencia_inicio", "vigencia_fin"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <p className="text-muted-foreground text-sm">
                  En hora de Iquitos. Déjalas vacías para que se vea desde que se publique y hasta
                  que la retires. Al pasar la fecha de fin se retira sola.
                </p>
                <Campo nombre="vigencia_inicio" etiqueta="Se ve desde" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(novedad?.vigencia_inicio ?? null)}
                    />
                  )}
                </Campo>
                <Campo nombre="vigencia_fin" etiqueta="Se ve hasta" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(novedad?.vigencia_fin ?? null)}
                    />
                  )}
                </Campo>
              </fieldset>
            ),
          },
          {
            valor: "imagen",
            titulo: "Imagen",
            campos: ["imagen_url"],
            contenido: (
              <fieldset disabled={soloLectura} className="contents">
                <SubidaImagen
                  nombre="imagen_url"
                  bucket="slides"
                  carpeta="novedades"
                  rutaInicial={novedad?.imagen_url ?? null}
                  etiqueta="Imagen de la novedad"
                />
              </fieldset>
            ),
          },
        ]}
      />

      {acciones.includes("devolver") ? (
        <Campo
          nombre="comentario_revision"
          etiqueta="Si la devuelves, ¿qué hay que corregir?"
          opcional
        >
          {(p) => <textarea {...p} rows={3} />}
        </Campo>
      ) : null}

      <BarraAprobacion acciones={acciones} />
    </FormularioPanel>
  );
}

function BarraAprobacion({ acciones }: { acciones: Intencion[] }) {
  const { pendiente } = useFormularioPanel();
  // La acción principal (la que no es «guardar») va en azul y a la derecha.
  const principales = acciones.filter((a) => a !== "guardar");
  return (
    <div className="bg-background/95 border-border sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-wrap justify-end gap-2 border-t px-4 py-3 md:bottom-0 md:mx-0 md:border-0 md:px-0">
      <Link href={VOLVER} className="boton-linea">
        {acciones.length === 0 ? "Volver" : "Cancelar"}
      </Link>
      {acciones.includes("guardar") ? (
        <button
          type="submit"
          name="intencion"
          value="guardar"
          className="boton-linea"
          disabled={pendiente}
        >
          Guardar
        </button>
      ) : null}
      {principales.map((a) => (
        <button
          key={a}
          type="submit"
          name="intencion"
          value={a}
          className={a === "devolver" || a === "archivar" ? "boton-linea" : "boton-cta"}
          disabled={pendiente}
        >
          {pendiente ? "Guardando…" : TEXTO_BOTON[a]}
        </button>
      ))}
    </div>
  );
}
