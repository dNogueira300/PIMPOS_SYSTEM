"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarFotoGaleria } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import {
  CATEGORIAS_GALERIA,
  NOMBRE_CATEGORIA_GALERIA,
  validarFotoGaleria,
} from "@/lib/validaciones/contenido";

export type FotoGaleriaEditable = {
  id: string;
  titulo: string | null;
  alt: string;
  ruta: string;
  categoria: string;
  estado: string;
};

const VOLVER = "/admin/contenido/galeria";

/** Pocos campos: una sola tarjeta, sin pestañas. */
export function FormularioFotoGaleria({ foto }: { foto: FotoGaleriaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("galeria", foto?.id ?? null)}
      accion={guardarFotoGaleria}
      validar={validarFotoGaleria}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={foto?.id ?? ""} />
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <SubidaImagen
          nombre="ruta"
          bucket="galeria"
          carpeta="panel"
          rutaInicial={foto?.ruta ?? null}
          etiqueta="Foto"
        />
        <Campo nombre="alt" etiqueta="Qué se ve en la foto">
          {(p) => <input {...p} defaultValue={foto?.alt ?? ""} />}
        </Campo>
        <Campo nombre="titulo" etiqueta="Pie de foto" opcional>
          {(p) => <input {...p} defaultValue={foto?.titulo ?? ""} />}
        </Campo>
        <Campo nombre="categoria" etiqueta="De qué es">
          {(p) => (
            <select {...p} defaultValue={foto?.categoria ?? ""}>
              <option value="">Elige una…</option>
              {CATEGORIAS_GALERIA.map((c) => (
                <option key={c} value={c}>
                  {NOMBRE_CATEGORIA_GALERIA[c]}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Interruptor
          nombre="publicado"
          etiqueta="Publicada"
          ayuda="Se ve en la galería"
          marcado={foto ? foto.estado === "publicado" : true}
        />
      </div>
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
