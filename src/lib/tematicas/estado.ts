import { alternativaDe } from "./disenos";

/**
 * El estado de una temática, dicho en palabras para el panel (plan 08, T2).
 *
 * Cuál está activa lo decide la base (`app.tematica_activa_id`, 0047) y llega
 * en `activa`; aquí solo se escribe. Las fechas son días de Iquitos
 * («2026-12-26»), sin hora. Solo depende del catálogo: se prueba sin base.
 */
export type EstadoTematica = {
  activa: boolean;
  /** El modo que manda hoy: un encendido manual caducado ya dice «fechas». */
  encendido_vigente: "fechas" | "encendida" | "apagada";
  inicio: string;
  fin: string;
  encendido_hasta: string | null;
};

const ENCENDIDOS = ["fechas", "encendida", "apagada"] as const;

/**
 * Si cambiar las fechas devuelve la temática a «Según fechas» (0047): pasa con
 * lo puesto a mano, salvo la «Apagada» de una temática con alternativa
 * (Halloween y el Día de la Canción Criolla), que sigue apagada (0050). Sale
 * del catálogo, no de una consulta: si una lectura falla, la frase no miente.
 */
export function vuelveASegunFechas(
  slug: string,
  encendido: EstadoTematica["encendido_vigente"],
): boolean {
  if (encendido === "fechas") return false;
  return !(encendido === "apagada" && alternativaDe(slug) !== null);
}

/** Lo que llega de la vista (texto, quizá NULL) como uno de los tres modos. */
export function comoEncendido(valor: string | null): EstadoTematica["encendido_vigente"] {
  return ENCENDIDOS.find((e) => e === valor) ?? "fechas";
}

/** «26/12». */
export function diaYMes(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

export function describirEstado(t: EstadoTematica, hoy: string): string {
  if (t.encendido_vigente === "encendida") {
    return `Encendida a mano hasta el ${diaYMes(t.encendido_hasta ?? t.fin)}`;
  }
  if (t.encendido_vigente === "apagada") {
    return `Apagada a mano hasta el ${diaYMes(t.encendido_hasta ?? t.fin)}`;
  }
  if (t.activa) return `Activa ahora, hasta el ${diaYMes(t.fin)}`;
  if (hoy > t.fin) return "Las fechas ya pasaron: pon las del próximo año";
  return `Se enciende sola el ${diaYMes(t.inicio)}`;
}

const CON_Y = new Intl.ListFormat("es", { type: "conjunction" });

/**
 * El aviso de la ficha de un producto que solo se vende en su temporada:
 * «Solo se vende en Navidad · ahora no se ve en el sitio». Basta una de sus
 * temáticas activa para que se vea (como `app.producto_en_temporada`).
 */
export function avisoSoloTemporada(
  tematicas: readonly { nombre: string; activa: boolean }[],
): string | null {
  if (tematicas.length === 0) return null;
  const cuando = CON_Y.format(tematicas.map((t) => t.nombre));
  const seVe = tematicas.some((t) => t.activa);
  return `Solo se vende en ${cuando} · ${seVe ? "hoy se ve" : "ahora no se ve"} en el sitio`;
}
