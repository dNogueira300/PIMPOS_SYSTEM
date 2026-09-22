"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { guardarGuia } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarGuia } from "@/lib/validaciones/contenido";

export type GuiaEditable = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  estado: string;
};

const VOLVER = "/admin/contenido/guias";

export function FormularioGuia({ guia }: { guia: GuiaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("guia", guia?.id ?? null)}
      accion={guardarGuia}
      validar={validarGuia}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={guia?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <Campo nombre="titulo" etiqueta="Título">
          {(p) => <input {...p} defaultValue={guia?.titulo ?? ""} />}
        </Campo>
        <Campo nombre="resumen" etiqueta="Resumen" opcional>
          {(p) => <input {...p} defaultValue={guia?.resumen ?? ""} />}
        </Campo>
        <Campo
          nombre="contenido"
          etiqueta="Pasos"
          ayuda="Deja una línea en blanco entre un paso y el siguiente: así se ven como párrafos separados."
        >
          {(p) => <textarea {...p} rows={8} defaultValue={guia?.contenido ?? ""} />}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en Preguntas frecuentes"
          marcado={guia ? guia.estado === "publicado" : false}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
