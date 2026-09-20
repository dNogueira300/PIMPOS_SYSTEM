"use client";

import { Campo, Interruptor } from "@/components/panel/campo";
import { BarraGuardar } from "@/components/panel/barra-guardar";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarCategoria } from "@/lib/acciones/categorias";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarCategoria } from "@/lib/validaciones/categoria";

export type CategoriaEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string;
};

const VOLVER = "/admin/contenido/categorias";

export function FormularioCategoria({ categoria }: { categoria: CategoriaEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("categoria", categoria?.id ?? null)}
      accion={guardarCategoria}
      validar={validarCategoria}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={categoria?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: ["nombre", "descripcion"],
            contenido: (
              <>
                <Campo nombre="nombre" etiqueta="Nombre">
                  {(p) => (
                    <input {...p} defaultValue={categoria?.nombre ?? ""} autoComplete="off" />
                  )}
                </Campo>
                <Campo nombre="descripcion" etiqueta="Descripción" opcional>
                  {(p) => <textarea {...p} rows={3} defaultValue={categoria?.descripcion ?? ""} />}
                </Campo>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicada"
                  ayuda="Se ve en el filtro del catálogo"
                  marcado={categoria ? categoria.estado === "publicado" : true}
                />
              </>
            ),
          },
          {
            valor: "foto",
            titulo: "Foto",
            campos: ["imagen_url"],
            contenido: (
              <SubidaImagen
                nombre="imagen_url"
                bucket="productos"
                carpeta="categorias"
                rutaInicial={categoria?.imagen_url ?? null}
                etiqueta="Foto de la categoría"
              />
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
