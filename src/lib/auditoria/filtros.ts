import { hoyEnLima, type Periodo, sumarDias } from "@/lib/insumos/periodo";

import { type Dueno, HIJOS_DE, type Seccion, SECCIONES } from "./catalogo";

export type Hizo = "creo" | "cambio" | "borro";
export type Cuando = "hoy" | "7" | "30" | "rango" | "todo";

/** Lo que pide la dirección de la pestaña Cambios, ya validado. */
export type Filtros = {
  /** El id de una persona, `"sistema"` (cambios sin persona) o todas. */
  persona: string | null;
  seccion: Seccion | null;
  hizo: Hizo | null;
  cuando: Cuando;
  /** En días de Iquitos. `null`: sin límite de fechas. */
  periodo: Periodo | null;
  /** «Ver historial» de un producto, un insumo o un cliente. */
  registro: { id: string; de: Dueno } | null;
  /** Cuántas filas enseñar: «Ver más» lo sube de 50 en 50, hasta 500. */
  ver: number;
};

export const POR_PAGINA = 50;
export const MAXIMO = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const fecha = (v: unknown): string | null => {
  const t = texto(v);
  return t && FECHA.test(t) && !Number.isNaN(new Date(`${t}T12:00:00Z`).getTime()) ? t : null;
};

/**
 * La dirección la puede escribir cualquiera: lo que no se reconoce se ignora
 * (vuelve a su valor de siempre) y nunca llega a la base un filtro inventado.
 */
export function leerFiltros(params: Record<string, unknown>, ahora: Date): Filtros {
  const persona = texto(params.persona);
  const seccion = texto(params.seccion);
  const hizo = texto(params.hizo);
  const de = texto(params.de);
  const idRegistro = texto(params.registro);
  const registro =
    idRegistro && UUID.test(idRegistro) && de && de in HIJOS_DE
      ? { id: idRegistro, de: de as Dueno }
      : null;

  const hoy = hoyEnLima(ahora);
  const pedido = texto(params.cuando);
  const desde = fecha(params.desde);
  const hasta = fecha(params.hasta);
  let cuando: Cuando = registro ? "todo" : "7";
  if (pedido === "hoy" || pedido === "7" || pedido === "30" || pedido === "todo") cuando = pedido;
  if (pedido === "rango" && desde && hasta) cuando = "rango";

  const periodos: Record<Cuando, Periodo | null> = {
    hoy: { desde: hoy, hasta: hoy },
    "7": { desde: sumarDias(hoy, -6), hasta: hoy },
    "30": { desde: sumarDias(hoy, -29), hasta: hoy },
    rango:
      desde && hasta ? (desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde }) : null,
    todo: null,
  };

  const pedidas = Number.parseInt(texto(params.ver) ?? "", 10);
  const ver = Number.isFinite(pedidas)
    ? Math.min(Math.max(pedidas, POR_PAGINA), MAXIMO)
    : POR_PAGINA;

  return {
    persona: persona === "sistema" || (persona && UUID.test(persona)) ? persona : null,
    seccion: SECCIONES.some((s) => s.valor === seccion) ? (seccion as Seccion) : null,
    hizo: hizo === "creo" || hizo === "cambio" || hizo === "borro" ? hizo : null,
    cuando,
    periodo: periodos[cuando],
    registro,
    ver,
  };
}

/** De días de Iquitos (UTC−5, sin horario de verano) a instantes para la base. */
export function limitesDelPeriodo(periodo: Periodo): { desde: string; hasta: string } {
  return {
    desde: `${periodo.desde}T05:00:00.000Z`,
    hasta: `${sumarDias(periodo.hasta, 1)}T05:00:00.000Z`,
  };
}

/** Los filtros, de vuelta a parámetros de la dirección (para «Ver más» y las pestañas). */
export function aParametros(f: Filtros, cambios: Partial<{ ver: number }> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (f.persona) p.set("persona", f.persona);
  if (f.seccion) p.set("seccion", f.seccion);
  if (f.hizo) p.set("hizo", f.hizo);
  if (f.registro) {
    p.set("registro", f.registro.id);
    p.set("de", f.registro.de);
  }
  if (f.cuando !== (f.registro ? "todo" : "7")) p.set("cuando", f.cuando);
  if (f.cuando === "rango" && f.periodo) {
    p.set("desde", f.periodo.desde);
    p.set("hasta", f.periodo.hasta);
  }
  const ver = cambios.ver ?? f.ver;
  if (ver !== POR_PAGINA) p.set("ver", String(ver));
  return p;
}
