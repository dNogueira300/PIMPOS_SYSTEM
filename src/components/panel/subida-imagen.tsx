"use client";

import imageCompression from "browser-image-compression";
import { Camera, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { rutaDeSubida, validarArchivo } from "@/lib/panel/imagen";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { urlDeImagen } from "@/lib/supabase/publico";

import { useFormularioPanel } from "./formulario-panel";

type Bucket = "productos" | "galeria" | "slides" | "marca";

type Props = {
  /** `name` del campo oculto que lleva la ruta a la acción. */
  nombre: string;
  bucket: Bucket;
  carpeta: string;
  rutaInicial: string | null;
  etiqueta: string;
  /** Logo y favicon no se comprimen: un SVG no se toca. */
  comprimir?: boolean;
  /** Para quien sube en el momento sin esperar a «Guardar» (fotos de producto). */
  alSubir?: (ruta: string) => void | Promise<void>;
  aceptar?: string;
  /** El límite del bucket (config.toml). Se comprueba ANTES de subir, con un mensaje que se entiende. */
  maximoBytes?: number;
};

type Fase = { tipo: "quieta" } | { tipo: "subiendo" } | { tipo: "error"; mensaje: string };

/**
 * Doc 03 §5.4: elegir o tomar → comprimir a WebP de 1600 px en el aparato →
 * subir al bucket con la sesión del usuario (la RLS de Storage decide) →
 * guardar la ruta. Sin el paso de comprimir, una foto de celular de 4 MB
 * llena el gigabyte gratuito en unas 250 fotos.
 */
export function SubidaImagen({
  nombre,
  bucket,
  carpeta,
  rutaInicial,
  etiqueta,
  comprimir = true,
  alSubir,
  aceptar = "image/*",
  maximoBytes = 3 * 1024 * 1024,
}: Props) {
  const oculto = useRef<HTMLInputElement>(null);
  const [ruta, setRuta] = useState(rutaInicial ?? "");
  const [fase, setFase] = useState<Fase>({ tipo: "quieta" });
  const { errores, registrarRestaurable } = useFormularioPanel();
  const errorDelFormulario = errores[nombre]?.[0];

  useEffect(() => registrarRestaurable(nombre, setRuta), [registrarRestaurable, nombre]);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    const problema = validarArchivo(archivo);
    if (problema) {
      setFase({ tipo: "error", mensaje: problema });
      return;
    }

    setFase({ tipo: "subiendo" });
    try {
      const listo = comprimir
        ? await imageCompression(archivo, {
            maxWidthOrHeight: 1600,
            fileType: "image/webp",
            initialQuality: 0.8,
            maxSizeMB: 1,
            useWebWorker: true,
          })
        : archivo;
      if (listo.size > maximoBytes) {
        setFase({
          tipo: "error",
          mensaje: `El archivo pesa más de ${Math.round(maximoBytes / 1024 / 1024)} MB. Elige uno más liviano.`,
        });
        return;
      }
      const extension = comprimir ? "webp" : (archivo.name.split(".").pop() ?? "png").toLowerCase();
      const nueva = rutaDeSubida(carpeta, crypto.randomUUID(), extension);

      const { error } = await crearClienteNavegador()
        .storage.from(bucket)
        .upload(nueva, listo, { contentType: listo.type || archivo.type, upsert: false });
      if (error) throw error;

      setRuta(nueva);
      await alSubir?.(nueva);
      setFase({ tipo: "quieta" });
      // El campo oculto cambió por código y eso no dispara `input`. Se avisa
      // en la vuelta siguiente del bucle, cuando React ya pintó la ruta nueva:
      // un microtask llegaría antes y la copia local guardaría la vieja.
      setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
    } catch (error) {
      console.error("[panel] subida de imagen", error);
      setFase({
        tipo: "error",
        mensaje: "No se pudo subir la foto. Revisa tu conexión e inténtalo otra vez.",
      });
    }
  }

  const vista = urlDeImagen(bucket, ruta);

  return (
    <fieldset className="flex flex-col gap-3" data-subida={nombre}>
      <legend className="text-sm font-semibold">{etiqueta}</legend>
      <input ref={oculto} type="hidden" name={nombre} value={ruta} />

      {vista ? (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo recién subido; next/image exigiría declarar el host y optimizar algo que se ve un segundo
        <img
          src={vista}
          alt=""
          className="bg-muted aspect-video w-full max-w-sm rounded-xl object-cover"
          data-vista-previa
        />
      ) : (
        <p className="text-muted-foreground text-sm">Todavía no hay foto.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {/*
          El input real va encima del botón decorativo, invisible
          (`opacity-0`) pero del mismo tamaño: así mide ≥ 44 px por sí mismo
          (e2e/panel-accesibilidad.spec.ts mide TODO `input` visible, no el
          `<label>` que lo envolviera) y sigue siendo un `<input type=file>`
          normal para el teclado y el lector de pantalla, con su nombre
          accesible en `aria-label` — lo que usa `page.getByLabel()` en las
          pruebas. Un `sr-only` de 1×1 px habría fallado esa prueba.
        */}
        <span className="relative inline-flex">
          <span aria-hidden className="boton-linea pointer-events-none">
            <Camera aria-hidden className="size-5" /> Tomar foto
          </span>
          <input
            type="file"
            accept={aceptar}
            capture="environment"
            aria-label="Tomar foto"
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={(e) => void elegir(e.currentTarget.files?.[0])}
            disabled={fase.tipo === "subiendo"}
          />
        </span>
        <span className="relative inline-flex">
          <span aria-hidden className="boton-linea pointer-events-none">
            <ImagePlus aria-hidden className="size-5" /> Elegir de la galería
          </span>
          <input
            type="file"
            accept={aceptar}
            aria-label="Elegir de la galería"
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={(e) => void elegir(e.currentTarget.files?.[0])}
            disabled={fase.tipo === "subiendo"}
          />
        </span>
      </div>

      <p aria-live="polite" className="text-sm" data-fase={fase.tipo}>
        {fase.tipo === "subiendo" ? "Achicando y subiendo la foto…" : null}
        {fase.tipo === "error" ? (
          <span className="text-destructive font-semibold">{fase.mensaje}</span>
        ) : null}
        {fase.tipo === "quieta" && errorDelFormulario ? (
          <span className="text-destructive font-semibold">{errorDelFormulario}</span>
        ) : null}
      </p>
    </fieldset>
  );
}
