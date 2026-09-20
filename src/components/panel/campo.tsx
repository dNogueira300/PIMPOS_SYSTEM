"use client";

import { useId, type ReactNode } from "react";

import { useFormularioPanel } from "./formulario-panel";

export type PropsDeControl = {
  id: string;
  name: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  className: string;
};

type Props = {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  opcional?: boolean;
  children: (control: PropsDeControl) => ReactNode;
};

/** Clase de los controles nativos del panel: 44 px, borde de 3:1, foco visible. */
export const CLASE_CONTROL =
  "min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base aria-invalid:border-destructive aria-invalid:border-2 focus-visible:outline-2 focus-visible:outline-ring";

export function Campo({ nombre, etiqueta, ayuda, opcional, children }: Props) {
  const id = useId();
  const { errores } = useFormularioPanel();
  const error = errores[nombre]?.[0];
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5" data-campo={nombre}>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
        {opcional ? <span className="text-muted-foreground font-normal"> (opcional)</span> : null}
      </label>
      {children({
        id,
        name: nombre,
        "aria-invalid": Boolean(error),
        "aria-describedby": [idAyuda, idError].filter(Boolean).join(" ") || undefined,
        className: CLASE_CONTROL,
      })}
      {ayuda ? (
        <p id={idAyuda} className="text-muted-foreground text-sm">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-destructive text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PropsInterruptor = { nombre: string; etiqueta: string; ayuda?: string; marcado: boolean };

/**
 * Casilla nativa con aspecto de interruptor: la copia local sí la puede
 * restaurar.
 *
 * `size-11` (44 px) y no `size-6`: la casilla es un `input` de verdad y
 * `e2e/panel-accesibilidad.spec.ts` mide TODO `input` visible, no solo el
 * `<label>` que lo envuelve — un interruptor más pequeño pasaría el clic (el
 * `<label>` cubre 48 px) pero fallaría la prueba de área táctil.
 */
export function Interruptor({ nombre, etiqueta, ayuda, marcado }: PropsInterruptor) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-12 items-center justify-between gap-4">
      <span>
        <span className="font-semibold">{etiqueta}</span>
        {ayuda ? <span className="text-muted-foreground block text-sm">{ayuda}</span> : null}
      </span>
      <input
        id={id}
        name={nombre}
        type="checkbox"
        role="switch"
        defaultChecked={marcado}
        className="accent-exito size-11 shrink-0"
      />
    </label>
  );
}
