"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
 *
 * Los controles van **controlados** y se vuelven a poner como diga la dirección
 * cada vez que esta cambia por otro camino (pulsar una pestaña, «Ver todo el
 * historial»): el formulario no se desmonta entre dos páginas de la misma
 * ruta, y con `defaultValue` seguiría diciendo los filtros de antes.
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
  const [buscando, empezar] = useTransition();
  const llegada = JSON.stringify([valores, conservar]);
  const [vista, setVista] = useState(llegada);
  const [elegido, setElegido] = useState(valores);
  if (vista !== llegada) {
    // Cambió la dirección: mandan sus valores (ajuste de estado durante el
    // render, sin efecto).
    setVista(llegada);
    setElegido(valores);
  }

  function aplicar(nuevo: Props["valores"]) {
    setElegido(nuevo);
    // Un rango a medias no se manda: la página caería a «los últimos 7 días»
    // y el desplegable diría otra cosa.
    if (nuevo.cuando === "rango" && !(nuevo.desde && nuevo.hasta)) return;
    const parametros = new URLSearchParams(conservar);
    if (nuevo.persona) parametros.set("persona", nuevo.persona);
    if (secciones && nuevo.seccion) parametros.set("seccion", nuevo.seccion);
    if (conHizo && nuevo.hizo) parametros.set("hizo", nuevo.hizo);
    parametros.set("cuando", nuevo.cuando);
    if (nuevo.cuando === "rango") {
      parametros.set("desde", nuevo.desde);
      parametros.set("hasta", nuevo.hasta);
    }
    empezar(() => router.replace(`${ruta}?${parametros.toString()}`, { scroll: false }));
  }

  const lista = (
    campo: "persona" | "seccion" | "hizo" | "cuando",
    etiqueta: string,
    opciones: readonly Opcion[],
  ) => (
    <label className="flex flex-col gap-1 text-sm">
      <span>{etiqueta}</span>
      <select
        name={campo}
        value={elegido[campo] ?? ""}
        onChange={(e) => aplicar({ ...elegido, [campo]: e.currentTarget.value })}
        className={CONTROL}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nombre}
          </option>
        ))}
      </select>
    </label>
  );

  const fecha = (campo: "desde" | "hasta", etiqueta: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span>{etiqueta}</span>
      <input
        type="date"
        name={campo}
        value={elegido[campo]}
        onChange={(e) => aplicar({ ...elegido, [campo]: e.currentTarget.value })}
        className={CONTROL}
      />
    </label>
  );

  return (
    <form
      aria-label="Filtros del historial"
      aria-busy={buscando}
      onSubmit={(e) => {
        e.preventDefault();
        aplicar(elegido);
      }}
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      {lista("persona", "Persona", [
        { valor: "", nombre: "Todas" },
        ...personas,
        ...(conSistema ? [{ valor: "sistema", nombre: "El sistema" }] : []),
      ])}
      {secciones
        ? lista("seccion", "Sección", [{ valor: "", nombre: "Todas" }, ...secciones])
        : null}
      {conHizo
        ? lista("hizo", "Qué hizo", [
            { valor: "", nombre: "Todo" },
            { valor: "creo", nombre: "Creó" },
            { valor: "cambio", nombre: "Cambió" },
            { valor: "borro", nombre: "Borró" },
          ])
        : null}
      {lista("cuando", "Cuándo", [
        { valor: "hoy", nombre: "Hoy" },
        { valor: "7", nombre: "Últimos 7 días" },
        { valor: "30", nombre: "Últimos 30 días" },
        { valor: "rango", nombre: "Entre dos fechas" },
        { valor: "todo", nombre: "Siempre" },
      ])}
      {elegido.cuando === "rango" ? (
        <>
          {fecha("desde", "Desde")}
          {fecha("hasta", "Hasta")}
        </>
      ) : null}
    </form>
  );
}
