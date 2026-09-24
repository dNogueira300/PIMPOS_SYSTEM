"use client";

import type { ReactNode } from "react";

import { BarraGuardar } from "@/components/panel/barra-guardar";
import { Campo, type PropsDeControl } from "@/components/panel/campo";
import { EditorHorario } from "@/components/panel/editor-horario";
import { FormularioPanel } from "@/components/panel/formulario-panel";
import { PestanasFormulario } from "@/components/panel/pestanas-formulario";
import { SelectorUbicacion } from "@/components/panel/selector-ubicacion";
import { SubidaImagen } from "@/components/panel/subida-imagen";
import { VistaFavicon } from "@/components/panel/vista-marca";
import { guardarConfiguracion } from "@/lib/acciones/configuracion";
import type { Dia, Tramo } from "@/lib/datos/reloj";
import { claveDeBorrador } from "@/lib/panel/borrador";
import { validarConfiguracion } from "@/lib/validaciones/configuracion-panel";

export type Ajuste = { clave: string; valor: unknown; descripcion: string };

const DOS_MB = 2 * 1024 * 1024;

export function FormularioConfiguracion({ ajustes }: { ajustes: Record<string, Ajuste> }) {
  const valor = (clave: string) => ajustes[clave]?.valor;
  const textoDe = (clave: string) =>
    typeof valor(clave) === "string" ? (valor(clave) as string) : "";
  const numeroDe = (clave: string) =>
    typeof valor(clave) === "number" ? String(valor(clave)) : "";
  const listaDe = (clave: string) =>
    Array.isArray(valor(clave)) ? (valor(clave) as string[]).join("\n") : "";

  /** Etiqueta, ayuda (la descripción de la base, sin PENDIENTE) y casilla de confirmar si hace falta. */
  function campo(clave: string, etiqueta: string, control: (p: PropsDeControl) => ReactNode) {
    const ajuste = ajustes[clave];
    const pendiente = ajuste?.descripcion.includes("PENDIENTE") ?? false;
    const ayuda = ajuste?.descripcion.replace(/\s*PENDIENTE[^.]*\./g, "").trim();
    return (
      <div
        className="flex flex-col gap-1"
        data-ajuste={clave}
        data-pendiente={pendiente || undefined}
      >
        {pendiente ? (
          <span className="bg-alerta/15 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Por confirmar
          </span>
        ) : null}
        <Campo nombre={clave} etiqueta={etiqueta} ayuda={ayuda}>
          {control}
        </Campo>
        {pendiente ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            {/*
              size-11 (44 px) y shrink-0: sin shrink-0, el texto largo de la
              etiqueta encoge el checkbox por debajo de 44 px dentro de este
              flex a 375 px (mismo motivo que Interruptor en campo.tsx).
              e2e/panel-accesibilidad.spec.ts mide TODO input visible.
            */}
            <input type="checkbox" name={`confirmar_${clave}`} className="size-11 shrink-0" />
            Este dato ya está confirmado con el negocio
          </label>
        ) : null}
      </div>
    );
  }

  const texto1 = (clave: string, etiqueta: string, extra: Record<string, string> = {}) =>
    campo(clave, etiqueta, (p) => <input {...p} {...extra} defaultValue={textoDe(clave)} />);
  const lineas = (clave: string, etiqueta: string) =>
    campo(clave, etiqueta, (p) => <textarea {...p} rows={4} defaultValue={listaDe(clave)} />);

  return (
    <FormularioPanel
      clave={claveDeBorrador("configuracion", "sitio")}
      accion={guardarConfiguracion}
      validar={validarConfiguracion}
    >
      <PestanasFormulario
        pestanas={[
          {
            valor: "contacto",
            titulo: "Contacto",
            campos: ["telefono", "whatsapp", "correo", "correo_alertas", "dias_aviso_vencimiento"],
            contenido: (
              <>
                {texto1("whatsapp", "WhatsApp de pedidos", { inputMode: "tel" })}
                {texto1("telefono", "Teléfono fijo", { inputMode: "tel" })}
                {texto1("correo", "Correo de contacto", { type: "email" })}
                {texto1("correo_alertas", "Correo para avisos de insumos", { type: "email" })}
                {campo("dias_aviso_vencimiento", "Días de aviso antes de vencer", (p) => (
                  <input
                    {...p}
                    type="number"
                    min={1}
                    max={90}
                    defaultValue={numeroDe("dias_aviso_vencimiento")}
                  />
                ))}
              </>
            ),
          },
          {
            valor: "ubicacion",
            titulo: "Ubicación",
            campos: [
              "direccion",
              "referencia",
              "distrito",
              "provincia",
              "departamento",
              "coordenadas",
            ],
            contenido: (
              <>
                {texto1("direccion", "Dirección")}
                {texto1("referencia", "Referencia")}
                {texto1("distrito", "Distrito")}
                {texto1("provincia", "Provincia")}
                {texto1("departamento", "Departamento")}
                <SelectorUbicacion
                  inicial={(valor("coordenadas") as { lat: number; lng: number } | null) ?? null}
                />
              </>
            ),
          },
          {
            valor: "horarios",
            titulo: "Horarios",
            campos: ["horario_semanal", "nota_horarios"],
            contenido: (
              <>
                <EditorHorario inicial={(valor("horario_semanal") as Record<Dia, Tramo[]>) ?? {}} />
                {texto1("nota_horarios", "Aclaración del horario")}
                <p className="text-muted-foreground text-sm">
                  La pregunta frecuente del horario repite las horas como texto. Si cambias el
                  horario, revísala en Contenido → Preguntas frecuentes.
                </p>
              </>
            ),
          },
          {
            valor: "pedidos",
            titulo: "Pedidos",
            campos: [
              "delivery_zonas",
              "delivery_costo",
              "pedido_minimo",
              "delivery_tiempo",
              "formas_pago",
            ],
            contenido: (
              <>
                {lineas("delivery_zonas", "Zonas de reparto (una por línea)")}
                {campo("delivery_costo", "Costo del delivery (S/)", (p) => (
                  <input {...p} inputMode="decimal" defaultValue={numeroDe("delivery_costo")} />
                ))}
                {campo("pedido_minimo", "Pedido mínimo (S/)", (p) => (
                  <input {...p} inputMode="decimal" defaultValue={numeroDe("pedido_minimo")} />
                ))}
                {texto1("delivery_tiempo", "Tiempo de entrega")}
                {lineas("formas_pago", "Formas de pago (una por línea)")}
              </>
            ),
          },
          {
            valor: "redes",
            titulo: "Redes",
            campos: ["facebook", "instagram"],
            contenido: (
              <>
                {texto1("facebook", "Facebook", {
                  inputMode: "url",
                  placeholder: "https://facebook.com/…",
                })}
                {texto1("instagram", "Instagram", {
                  inputMode: "url",
                  placeholder: "https://instagram.com/…",
                })}
                <p className="text-muted-foreground text-sm">
                  Si una red queda vacía, el pie del sitio no la muestra.
                </p>
              </>
            ),
          },
          {
            valor: "marca",
            titulo: "Marca",
            campos: [
              "nombre_comercial",
              "razon_social",
              "eslogan",
              "logo_url",
              "logo_alt",
              "isotipo_url",
              "favicon_url",
            ],
            contenido: (
              <>
                {texto1("nombre_comercial", "Nombre del negocio")}
                {texto1("razon_social", "Razón social")}
                {texto1("eslogan", "Eslogan")}
                <SubidaImagen
                  nombre="isotipo_url"
                  bucket="marca"
                  carpeta="isotipo"
                  rutaInicial={textoDe("isotipo_url")}
                  etiqueta="Dibujo del logo (cabecera del sitio)"
                  comprimir={false}
                  aceptar="image/svg+xml,image/png,image/webp"
                  maximoBytes={DOS_MB}
                />
                <SubidaImagen
                  nombre="logo_url"
                  bucket="marca"
                  carpeta="logo"
                  rutaInicial={textoDe("logo_url")}
                  etiqueta="Logo completo"
                  comprimir={false}
                  aceptar="image/png,image/webp"
                  maximoBytes={DOS_MB}
                />
                {texto1("logo_alt", "Texto del logo para quien no lo ve")}
                <SubidaImagen
                  nombre="favicon_url"
                  bucket="marca"
                  carpeta="favicon"
                  rutaInicial={textoDe("favicon_url")}
                  etiqueta="Icono de la pestaña del navegador"
                  comprimir={false}
                  aceptar="image/svg+xml,image/png"
                  maximoBytes={DOS_MB}
                />
                <VistaFavicon nombreCampo="favicon_url" />
              </>
            ),
          },
        ]}
      />
      <BarraGuardar volver="/admin" />
    </FormularioPanel>
  );
}
