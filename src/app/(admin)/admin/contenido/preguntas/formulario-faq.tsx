"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarFaq } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarFaq } from "@/lib/validaciones/contenido";

export type FaqEditable = { id: string; pregunta: string; respuesta: string; estado: string };

const VOLVER = "/admin/contenido/preguntas";

export function FormularioFaq({ faq }: { faq: FaqEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("faq", faq?.id ?? null)}
      accion={guardarFaq}
      validar={validarFaq}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={faq?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="pregunta" etiqueta="Pregunta">
          {(p) => <input {...p} defaultValue={faq?.pregunta ?? ""} />}
        </Campo>
        <Campo
          nombre="respuesta"
          etiqueta="Respuesta"
          ayuda="Si hablas del horario, revisa que coincida con el de Configuración."
        >
          {(p) => <textarea {...p} rows={5} defaultValue={faq?.respuesta ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en Preguntas frecuentes"
          marcado={faq ? faq.estado === "publicado" : true}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
