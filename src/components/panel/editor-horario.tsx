"use client";

import { useEffect, useRef, useState } from "react";

import { DIAS, type Dia, type Tramo } from "@/lib/datos/reloj";

import { CLASE_CONTROL } from "./campo";
import { useFormularioPanel } from "./formulario-panel";

type Horario = Record<Dia, Tramo[]>;

const NOMBRE: Record<Dia, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

/**
 * Dos turnos por día como máximo (ficha 1.9). «Cerrado» es un día sin turnos,
 * que el sitio muestra como tal. Viaja en un campo oculto con JSON, igual que
 * las presentaciones de un producto.
 */
export function EditorHorario({ inicial }: { inicial: Horario }) {
  const { registrarRestaurable, errores } = useFormularioPanel();
  const oculto = useRef<HTMLInputElement>(null);
  const [horario, setHorario] = useState<Horario>(inicial);

  useEffect(
    () =>
      registrarRestaurable("horario_semanal", (valor) => {
        try {
          setHorario(JSON.parse(valor) as Horario);
        } catch {
          // Una copia rota no pisa lo que hay.
        }
      }),
    [registrarRestaurable],
  );

  function cambiar(dia: Dia, tramos: Tramo[]) {
    setHorario((h) => ({ ...h, [dia]: tramos }));
    setTimeout(() => oculto.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={oculto} type="hidden" name="horario_semanal" value={JSON.stringify(horario)} />
      {DIAS.map((dia) => {
        const tramos = horario[dia] ?? [];
        const cerrado = tramos.length === 0;
        return (
          <fieldset
            key={dia}
            className="bg-muted/40 flex flex-col gap-2 rounded-xl p-3"
            data-dia={dia}
          >
            <legend className="sr-only">{NOMBRE[dia]}</legend>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{NOMBRE[dia]}</span>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                {/*
                  size-11 (44 px), no size-5: e2e/panel-accesibilidad.spec.ts
                  mide TODO input visible, no el <label> que lo envuelve (ver
                  el mismo razonamiento en components/panel/campo.tsx,
                  Interruptor).
                */}
                <input
                  type="checkbox"
                  className="size-11"
                  checked={cerrado}
                  onChange={(e) =>
                    cambiar(
                      dia,
                      e.currentTarget.checked ? [] : [{ desde: "04:00", hasta: "13:00" }],
                    )
                  }
                />
                Cerrado
              </label>
            </div>
            {tramos.map((tramo, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr] gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  Turno {i + 1}: abre
                  <input
                    type="time"
                    className={CLASE_CONTROL}
                    value={tramo.desde}
                    onChange={(e) =>
                      cambiar(
                        dia,
                        tramos.map((t, j) =>
                          j === i ? { ...t, desde: e.currentTarget.value } : t,
                        ),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  cierra
                  <input
                    type="time"
                    className={CLASE_CONTROL}
                    value={tramo.hasta}
                    onChange={(e) =>
                      cambiar(
                        dia,
                        tramos.map((t, j) =>
                          j === i ? { ...t, hasta: e.currentTarget.value } : t,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            ))}
            {!cerrado && tramos.length < 2 ? (
              <button
                type="button"
                className="boton-linea w-fit"
                onClick={() => cambiar(dia, [...tramos, { desde: "16:00", hasta: "21:00" }])}
              >
                Añadir segundo turno
              </button>
            ) : null}
            {tramos.length === 2 ? (
              <button
                type="button"
                className="boton-linea w-fit"
                onClick={() => cambiar(dia, tramos.slice(0, 1))}
              >
                Quitar segundo turno
              </button>
            ) : null}
          </fieldset>
        );
      })}
      {errores.horario_semanal?.length ? (
        <p className="text-destructive text-sm font-semibold">{errores.horario_semanal[0]}</p>
      ) : null}
    </div>
  );
}
