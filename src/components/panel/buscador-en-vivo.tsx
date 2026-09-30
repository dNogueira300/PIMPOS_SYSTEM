"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type FormEvent } from "react";

import { CLASE_CONTROL } from "./campo";

type Filtro = {
  nombre: string;
  etiqueta: string;
  valor: string;
  opciones: readonly { valor: string; nombre: string }[];
};

type Props = {
  /** El parámetro de la dirección que lleva el texto (`q`, `buscar`…). */
  nombre: string;
  etiqueta: string;
  placeholder: string;
  valor: string;
  /** Desplegables que filtran al elegir, en el mismo formulario. */
  filtros?: readonly Filtro[];
};

/** Lo que se espera entre tecla y tecla antes de pedir la lista nueva. */
const PAUSA_MS = 250;

/**
 * Buscar mientras se escribe, sin Enter, sin botón y sin recargar la página
 * (Dan, 29/09/2026). La búsqueda sigue viviendo en la dirección (`?q=…`), así
 * que se puede recargar o compartir, y la lista la sigue filtrando la base:
 * aquí solo se cambia la dirección con `router.replace`, dentro de una
 * transición para que la lista de antes siga a la vista hasta que llega la
 * nueva. Sin JavaScript es el mismo formulario GET de antes, con Enter.
 */
export function BuscadorEnVivo({ nombre, etiqueta, placeholder, valor, filtros = [] }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const [buscando, empezar] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(espera.current), []);

  function aplicar() {
    clearTimeout(espera.current);
    const datos = new FormData(formulario.current ?? undefined);
    const parametros = new URLSearchParams();
    for (const [clave, v] of datos) {
      if (typeof v === "string" && v.trim() !== "") parametros.set(clave, v.trim());
    }
    const consulta = parametros.toString();
    empezar(() => {
      router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
    });
  }

  function alEscribir() {
    clearTimeout(espera.current);
    espera.current = setTimeout(aplicar, PAUSA_MS);
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    aplicar();
  }

  const idTexto = `buscar-${nombre}`;
  return (
    <form
      ref={formulario}
      role="search"
      aria-busy={buscando}
      onSubmit={alEnviar}
      className="mb-4 flex flex-wrap gap-2"
    >
      <label className="sr-only" htmlFor={idTexto}>
        {etiqueta}
      </label>
      <input
        id={idTexto}
        type="search"
        name={nombre}
        defaultValue={valor}
        placeholder={placeholder}
        autoComplete="off"
        onChange={alEscribir}
        className={`${CLASE_CONTROL} min-w-0 flex-1 basis-56`}
      />
      {filtros.map((f) => (
        <span key={f.nombre} className="contents">
          <label className="sr-only" htmlFor={`filtro-${f.nombre}`}>
            {f.etiqueta}
          </label>
          <select
            id={`filtro-${f.nombre}`}
            name={f.nombre}
            defaultValue={f.valor}
            onChange={aplicar}
            className={`${CLASE_CONTROL} w-auto sm:w-56`}
          >
            {f.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </select>
        </span>
      ))}
    </form>
  );
}
