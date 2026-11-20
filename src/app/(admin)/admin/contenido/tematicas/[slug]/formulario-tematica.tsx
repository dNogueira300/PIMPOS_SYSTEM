"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo } from "@/components/panel/campo";
import {
  EditorProductosTemporada,
  type ProductoDeTemporada,
} from "@/components/panel/editor-productos-temporada";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { guardarTematica } from "@/lib/acciones/tematicas";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarTematica } from "@/lib/validaciones/tematica";

export type TematicaEditable = {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  fecha_evento: string | null;
  encendido_vigente: "fechas" | "encendida" | "apagada";
  texto_aviso: string | null;
  mensajes_cinta: string[];
  titulo: string | null;
  entradilla: string | null;
};

const VOLVER = "/admin/contenido/tematicas";

const OPCIONES_ENCENDIDO = [
  {
    valor: "fechas",
    nombre: "Según fechas",
    ayuda: "Se enciende sola el día que empieza y se apaga sola el día después de que termina.",
  },
  {
    valor: "encendida",
    nombre: "Encendida ya",
    ayuda: "Se enciende ahora y se apaga sola el día que termina.",
  },
  {
    valor: "apagada",
    nombre: "Apagada",
    ayuda: "No se enciende hasta el día que termina, aunque esté dentro de sus fechas.",
  },
] as const;

export function FormularioTematica({
  tematica,
  productos,
  catalogo,
}: {
  tematica: TematicaEditable;
  productos: ProductoDeTemporada[];
  catalogo: readonly { id: string; nombre: string }[];
}) {
  const manual = tematica.encendido_vigente !== "fechas";
  return (
    <FormularioPanel
      clave={claveDeBorrador("tematica", tematica.id)}
      accion={guardarTematica}
      validar={validarTematica}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={tematica.id} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "cuando",
            titulo: "Cuándo",
            campos: ["inicio", "fin", "fecha_evento", "encendido"],
            contenido: (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo nombre="inicio" etiqueta="Empieza el">
                    {(p) => <input {...p} type="date" defaultValue={tematica.inicio} />}
                  </Campo>
                  <Campo nombre="fin" etiqueta="Termina el">
                    {(p) => <input {...p} type="date" defaultValue={tematica.fin} />}
                  </Campo>
                </div>
                <Campo
                  nombre="fecha_evento"
                  etiqueta={`Fecha de ${tematica.nombre}`}
                  opcional
                  ayuda="Para la cuenta regresiva de la portada: «Faltan 12 días»."
                >
                  {(p) => <input {...p} type="date" defaultValue={tematica.fecha_evento ?? ""} />}
                </Campo>
                <fieldset className="flex flex-col gap-2" data-campo="encendido">
                  <legend className="mb-1 text-sm font-semibold">Cómo se enciende</legend>
                  {OPCIONES_ENCENDIDO.map((o) => (
                    <label
                      key={o.valor}
                      className="bg-card flex min-h-11 items-center gap-3 rounded-md border p-3"
                    >
                      <input
                        type="radio"
                        name="encendido"
                        value={o.valor}
                        defaultChecked={tematica.encendido_vigente === o.valor}
                        className="accent-primary size-11 shrink-0"
                      />
                      <span>
                        <span className="font-semibold">{o.nombre}</span>
                        <span className="text-muted-foreground block text-sm">{o.ayuda}</span>
                      </span>
                    </label>
                  ))}
                  {manual ? (
                    <p className="text-muted-foreground text-sm">
                      Si cambias las fechas, la temática vuelve a «Según fechas».
                    </p>
                  ) : null}
                </fieldset>
              </>
            ),
          },
          {
            valor: "textos",
            titulo: "Textos",
            campos: ["texto_aviso", "mensajes_cinta", "titulo", "entradilla"],
            contenido: (
              <>
                <Campo
                  nombre="texto_aviso"
                  etiqueta="Texto de la barra de arriba"
                  opcional
                  ayuda="Reemplaza al horario mientras la temática está encendida. Hasta 120 letras."
                >
                  {(p) => <input {...p} defaultValue={tematica.texto_aviso ?? ""} />}
                </Campo>
                <Campo
                  nombre="mensajes_cinta"
                  etiqueta="Mensajes de la cinta"
                  opcional
                  ayuda="Un mensaje por línea. Hasta 6 mensajes de 60 letras."
                >
                  {(p) => (
                    <textarea {...p} rows={5} defaultValue={tematica.mensajes_cinta.join("\n")} />
                  )}
                </Campo>
                <Campo
                  nombre="titulo"
                  etiqueta="Título de la sección de temporada"
                  opcional
                  ayuda="Hasta 80 letras."
                >
                  {(p) => <input {...p} defaultValue={tematica.titulo ?? ""} />}
                </Campo>
                <Campo
                  nombre="entradilla"
                  etiqueta="Entradilla de la sección"
                  opcional
                  ayuda="Una frase debajo del título. Hasta 240 letras."
                >
                  {(p) => <textarea {...p} rows={3} defaultValue={tematica.entradilla ?? ""} />}
                </Campo>
              </>
            ),
          },
          {
            valor: "productos",
            titulo: "Productos",
            campos: ["productos"],
            contenido: <EditorProductosTemporada iniciales={productos} catalogo={catalogo} />,
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
