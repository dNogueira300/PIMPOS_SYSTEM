"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { EditorPresentaciones, type Presentacion } from "@/components/panel/editor-presentaciones";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { FotosProducto, type FotoProducto } from "@/components/panel/fotos-producto";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { guardarProducto } from "@/lib/acciones/productos";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarProducto } from "@/lib/validaciones/producto";

export type ProductoEditable = {
  id: string;
  nombre: string;
  categoria_id: string;
  descripcion: string | null;
  destacado: boolean;
  estado: string;
  presentaciones: Presentacion[];
  fotos: FotoProducto[];
};

const VOLVER = "/admin/contenido/productos";

type Props = { producto: ProductoEditable | null; categorias: { id: string; nombre: string }[] };

export function FormularioProducto({ producto, categorias }: Props) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("producto", producto?.id ?? null)}
      accion={guardarProducto}
      validar={validarProducto}
      // Al crear, se vuelve a la ficha recién creada para poder añadirle fotos.
      destino={(id) => (producto ? VOLVER : `${VOLVER}/${id}`)}
    >
      <input type="hidden" name="id" value={producto?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "datos",
            titulo: "Datos",
            campos: ["nombre", "categoria_id", "descripcion"],
            contenido: (
              <>
                <Campo nombre="nombre" etiqueta="Nombre">
                  {(p) => <input {...p} defaultValue={producto?.nombre ?? ""} autoComplete="off" />}
                </Campo>
                <Campo nombre="categoria_id" etiqueta="Categoría">
                  {(p) => (
                    <select {...p} defaultValue={producto?.categoria_id ?? ""}>
                      <option value="">Elige una…</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo nombre="descripcion" etiqueta="Descripción" opcional>
                  {(p) => <textarea {...p} rows={3} defaultValue={producto?.descripcion ?? ""} />}
                </Campo>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicado"
                  ayuda="Se ve en el sitio"
                  marcado={producto ? producto.estado === "publicado" : false}
                />
                <Interruptor
                  nombre="destacado"
                  etiqueta="Destacado en la portada"
                  ayuda="Sale en la portada solo si tiene foto"
                  marcado={producto?.destacado ?? false}
                />
                {producto?.destacado && producto.fotos.length === 0 ? (
                  <p className="bg-alerta/15 rounded-lg p-3 text-sm" role="note">
                    No saldrá en la portada hasta que tenga foto.
                  </p>
                ) : null}
              </>
            ),
          },
          {
            valor: "precios",
            titulo: "Precios",
            campos: ["presentaciones"],
            contenido: <EditorPresentaciones iniciales={producto?.presentaciones ?? []} />,
          },
          {
            valor: "fotos",
            titulo: "Fotos",
            campos: [],
            contenido: (
              <FotosProducto
                productoId={producto?.id ?? null}
                nombreProducto={producto?.nombre ?? ""}
                fotos={producto?.fotos ?? []}
              />
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
