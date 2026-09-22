"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarTestimonio } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarTestimonio } from "@/lib/validaciones/contenido";

export type TestimonioEditable = {
  id: string;
  nombre: string;
  texto: string;
  procedencia: string | null;
  estado: string;
  es_demo: boolean;
};

const VOLVER = "/admin/contenido/testimonios";

export function FormularioTestimonio({ testimonio }: { testimonio: TestimonioEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("testimonio", testimonio?.id ?? null)}
      accion={guardarTestimonio}
      validar={validarTestimonio}
      destino={() => VOLVER}
    >
      {testimonio?.es_demo ? (
        <p role="note" className="bg-alerta/15 rounded-xl p-4">
          Este testimonio es <strong>de ejemplo</strong> y nunca se publica, aunque lo marques. Un
          testimonio inventado es una reseña falsa. Bórralo cuando tengas uno real.
        </p>
      ) : null}
      <input type="hidden" name="id" value={testimonio?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo
          nombre="nombre"
          etiqueta="Nombre de quien lo dice"
          ayuda="Pide permiso antes de publicar su nombre."
        >
          {(p) => <input {...p} defaultValue={testimonio?.nombre ?? ""} />}
        </Campo>
        <Campo nombre="procedencia" etiqueta="De dónde es" opcional>
          {(p) => <input {...p} defaultValue={testimonio?.procedencia ?? ""} placeholder="Belén" />}
        </Campo>
        <Campo nombre="texto" etiqueta="Lo que dijo">
          {(p) => <textarea {...p} rows={4} defaultValue={testimonio?.texto ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicado"
          ayuda="Se ve en la portada"
          marcado={testimonio ? testimonio.estado === "publicado" : false}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
