"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Opcion = { valor: string; nombre: string };

type Props = {
  personas: readonly Opcion[];
  secciones?: readonly Opcion[];
  conHizo?: boolean;
  /** «El sistema» entre las personas: los cambios del cron y de las migraciones. */
  conSistema?: boolean;
  valores: {
    persona: string;
    seccion?: string;
    hizo?: string;
    cuando: string;
    desde: string;
    hasta: string;
  };
  /** Parámetros que no son filtros y se conservan («Ver historial» de un registro). */
  conservar?: Readonly<Record<string, string>>;
};

const CONTROL = "border-input bg-card min-h-11 rounded-xl border px-3";

/**
 * Los filtros del historial se aplican al elegir, sin botón y sin recargar la
 * página (como `BuscadorEnVivo`): la dirección cambia con `router.replace`
 * dentro de una transición y la lista de antes sigue a la vista hasta que
 * llega la nueva. Las fechas del rango solo aparecen al elegir «Entre dos fechas».
 */
export function FiltrosHistorial({
  personas,
  secciones,
  conHizo = false,
  conSistema = false,
  valores,
  conservar = {},
}: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const formulario = useRef<HTMLFormElement>(null);
  const [cuando, setCuando] = useState(valores.cuando);
  const [buscando, empezar] = useTransition();

  function aplicar() {
    const datos = new FormData(formulario.current ?? undefined);
    const parametros = new URLSearchParams();
    for (const [clave, v] of datos) {
      if (typeof v === "string" && v !== "") parametros.set(clave, v);
    }
    // Un rango a medias no se manda: la página caería a «los últimos 7 días»
    // y el desplegable diría otra cosa.
    if (
      parametros.get("cuando") === "rango" &&
      !(parametros.get("desde") && parametros.get("hasta"))
    ) {
      return;
    }
    const consulta = parametros.toString();
    empezar(() => router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false }));
  }

  const lista = (nombre: string, etiqueta: string, valor: string, opciones: readonly Opcion[]) => (
    <label className="flex flex-col gap-1 text-sm">
      <span>{etiqueta}</span>
      <select name={nombre} defaultValue={valor} onChange={aplicar} className={CONTROL}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nombre}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      ref={formulario}
      aria-label="Filtros del historial"
      aria-busy={buscando}
      onSubmit={(e) => {
        e.preventDefault();
        aplicar();
      }}
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      {Object.entries(conservar).map(([clave, v]) => (
        <input key={clave} type="hidden" name={clave} value={v} />
      ))}
      {lista("persona", "Persona", valores.persona, [
        { valor: "", nombre: "Todas" },
        ...personas,
        ...(conSistema ? [{ valor: "sistema", nombre: "El sistema" }] : []),
      ])}
      {secciones
        ? lista("seccion", "Sección", valores.seccion ?? "", [
            { valor: "", nombre: "Todas" },
            ...secciones,
          ])
        : null}
      {conHizo
        ? lista("hizo", "Qué hizo", valores.hizo ?? "", [
            { valor: "", nombre: "Todo" },
            { valor: "creo", nombre: "Creó" },
            { valor: "cambio", nombre: "Cambió" },
            { valor: "borro", nombre: "Borró" },
          ])
        : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>Cuándo</span>
        <select
          name="cuando"
          defaultValue={valores.cuando}
          onChange={(e) => {
            setCuando(e.currentTarget.value);
            aplicar();
          }}
          className={CONTROL}
        >
          <option value="hoy">Hoy</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="rango">Entre dos fechas</option>
          <option value="todo">Siempre</option>
        </select>
      </label>
      {cuando === "rango" ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span>Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={valores.desde}
              onChange={aplicar}
              className={CONTROL}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={valores.hasta}
              onChange={aplicar}
              className={CONTROL}
            />
          </label>
        </>
      ) : null}
    </form>
  );
}
