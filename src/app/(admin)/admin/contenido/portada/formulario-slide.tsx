"use client";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, Interruptor } from "@/components/panel/campo";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { guardarSlide } from "@/lib/acciones/contenido";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { utcALima } from "@/lib/panel/hora-lima";
import { validarSlide } from "@/lib/validaciones/contenido";

export type SlideEditable = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagen_url: string;
  imagen_movil_url: string | null;
  imagen_alt: string | null;
  enlace_url: string | null;
  texto_boton: string | null;
  enfoque: number;
  estado: string;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
};

const VOLVER = "/admin/contenido/portada";

export function FormularioSlide({ slide }: { slide: SlideEditable | null }) {
  return (
    <FormularioPanel
      clave={claveDeBorrador("slide", slide?.id ?? null)}
      accion={guardarSlide}
      validar={validarSlide}
      destino={() => VOLVER}
    >
      <input type="hidden" name="id" value={slide?.id ?? ""} />
      <PestanasFormulario
        pestanas={[
          {
            valor: "texto",
            titulo: "Texto",
            campos: ["titulo", "subtitulo"],
            contenido: (
              <>
                <Campo nombre="titulo" etiqueta="Titular">
                  {(p) => <input {...p} defaultValue={slide?.titulo ?? ""} />}
                </Campo>
                <Campo nombre="subtitulo" etiqueta="Frase de apoyo" opcional>
                  {(p) => <input {...p} defaultValue={slide?.subtitulo ?? ""} />}
                </Campo>
                <p className="text-muted-foreground text-sm">
                  No escribas cuántos años tiene el negocio: di el año («desde 2004»), que no
                  caduca.
                </p>
                <Interruptor
                  nombre="publicado"
                  etiqueta="Publicado"
                  ayuda="Se ve en la portada"
                  marcado={slide ? slide.estado === "publicado" : false}
                />
              </>
            ),
          },
          {
            valor: "fotos",
            titulo: "Fotos",
            campos: ["imagen_url", "imagen_alt", "enfoque"],
            contenido: (
              <>
                <SubidaImagen
                  nombre="imagen_url"
                  bucket="slides"
                  carpeta="portada"
                  rutaInicial={slide?.imagen_url ?? null}
                  etiqueta="Foto grande (computadora)"
                />
                <SubidaImagen
                  nombre="imagen_movil_url"
                  bucket="slides"
                  carpeta="portada"
                  rutaInicial={slide?.imagen_movil_url ?? null}
                  etiqueta="Foto vertical (celular, opcional)"
                />
                <Campo nombre="imagen_alt" etiqueta="Qué se ve en la foto">
                  {(p) => <input {...p} defaultValue={slide?.imagen_alt ?? ""} />}
                </Campo>
                <Campo
                  nombre="enfoque"
                  etiqueta="Qué parte de la foto se ve al recortar"
                  ayuda="0 es arriba, 100 es abajo."
                >
                  {(p) => (
                    <input
                      {...p}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      defaultValue={slide?.enfoque ?? 50}
                      className={`${p.className} accent-primary`}
                    />
                  )}
                </Campo>
              </>
            ),
          },
          {
            valor: "boton",
            titulo: "Botón y fechas",
            campos: ["enlace_url", "texto_boton", "vigencia_inicio", "vigencia_fin"],
            contenido: (
              <>
                <Campo nombre="texto_boton" etiqueta="Texto del botón" opcional>
                  {(p) => (
                    <input
                      {...p}
                      defaultValue={slide?.texto_boton ?? ""}
                      placeholder="Ver productos"
                    />
                  )}
                </Campo>
                <Campo
                  nombre="enlace_url"
                  etiqueta="A dónde lleva"
                  ayuda="Una página del sitio (/productos) o una dirección que empiece por https://"
                  opcional
                >
                  {(p) => <input {...p} defaultValue={slide?.enlace_url ?? ""} inputMode="url" />}
                </Campo>
                <Campo nombre="vigencia_inicio" etiqueta="Se ve desde" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(slide?.vigencia_inicio ?? null)}
                    />
                  )}
                </Campo>
                <Campo nombre="vigencia_fin" etiqueta="Se ve hasta" opcional>
                  {(p) => (
                    <input
                      {...p}
                      type="datetime-local"
                      defaultValue={utcALima(slide?.vigencia_fin ?? null)}
                    />
                  )}
                </Campo>
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver={VOLVER} />
    </FormularioPanel>
  );
}
