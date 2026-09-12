import { describe, expect, it } from "vitest";

import { agruparHorario, estadoDelHorario } from "./horario";

// El horario lo mira el cliente antes de salir de casa. Un fallo aqui no rompe
// la pagina: le dice que abre un dia que cierra, o al reves.

const MANANA = { desde: "04:00", hasta: "13:00" };
const TARDE = { desde: "16:00", hasta: "21:00" };
const DOS_TURNOS = [MANANA, TARDE];

const SEMANA_DE_PIMPOS = {
  lunes: DOS_TURNOS,
  martes: DOS_TURNOS,
  miercoles: DOS_TURNOS,
  jueves: DOS_TURNOS,
  viernes: DOS_TURNOS,
  sabado: DOS_TURNOS,
  domingo: [],
};

describe("agruparHorario", () => {
  it("junta los dias seguidos que abren igual", () => {
    // El horario de Pimpo's eran siete filas casi identicas (critica del
    // 11/09): de lunes a sabado igual y el domingo cerrado. Son dos datos.
    expect(agruparHorario(SEMANA_DE_PIMPOS)).toEqual([
      { dias: "Lunes a sábado", tramos: DOS_TURNOS },
      { dias: "Domingo", tramos: [] },
    ]);
  });

  it("dos dias seguidos se unen con «y», y tres o mas con «a»", () => {
    // "Sábado a domingo" suena a un rango largo; asi no lo diria nadie.
    const grupos = agruparHorario({ ...SEMANA_DE_PIMPOS, sabado: [MANANA], domingo: [MANANA] });
    expect(grupos.map((g) => g.dias)).toEqual(["Lunes a viernes", "Sábado y domingo"]);
  });

  it("no junta dias iguales que no van seguidos", () => {
    // Si el miercoles cierra, "Lunes a sábado" diria que tambien abre.
    const grupos = agruparHorario({ ...SEMANA_DE_PIMPOS, miercoles: [] });
    expect(grupos.map((g) => g.dias)).toEqual([
      "Lunes y martes",
      "Miércoles",
      "Jueves a sábado",
      "Domingo",
    ]);
  });

  it("un dia con un turno distinto parte el grupo", () => {
    const grupos = agruparHorario({ ...SEMANA_DE_PIMPOS, sabado: [MANANA] });
    expect(grupos).toEqual([
      { dias: "Lunes a viernes", tramos: DOS_TURNOS },
      { dias: "Sábado", tramos: [MANANA] },
      { dias: "Domingo", tramos: [] },
    ]);
  });

  it("un dia que falta en la configuracion cuenta como cerrado", () => {
    // El horario lo edita una persona desde el panel. Si borra un dia, ese dia
    // no puede desaparecer del horario como si no existiera.
    expect(agruparHorario({ lunes: [MANANA] })).toEqual([
      { dias: "Lunes", tramos: [MANANA] },
      { dias: "Martes a domingo", tramos: [] },
    ]);
  });

  it("sin ningun dia cargado no anuncia que cierra toda la semana", () => {
    // Pasa si la configuracion no llega y el sitio usa la de reserva. Decir
    // "Lunes a domingo: cerrado" a quien iba a salir a comprar seria peor que
    // no decir nada.
    expect(agruparHorario({})).toEqual([]);
  });
});

/**
 * Las fechas van en UTC a proposito y con su hora de Iquitos al lado: es la
 * unica forma de comprobar que la funcion mira el reloj de la panaderia y no el
 * del visitante. Septiembre de 2026: el 15 es martes, el 19 sabado, el 20
 * domingo y el 21 lunes.
 */
describe("estadoDelHorario", () => {
  it("dentro de un turno dice que esta abierto y hasta cuando", () => {
    // Martes, 10:00 en Iquitos.
    expect(estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-15T15:00:00Z"))).toEqual({
      abierto: true,
      etiqueta: "Abierto ahora",
      detalle: "Hasta la 1:00 p. m.",
    });
  });

  it("abre en el minuto de apertura y cierra en el de cierre", () => {
    // Las 4:00 en punto ya se atiende; la 1:00 en punto ya no. Es el limite que
    // decide si el cliente sale de casa para nada.
    const apertura = estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-15T09:00:00Z"));
    const cierre = estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-15T18:00:00Z"));

    expect(apertura?.abierto).toBe(true);
    expect(cierre?.abierto).toBe(false);
    expect(cierre?.detalle).toBe("Abre hoy a las 4:00 p. m.");
  });

  it("entre los dos turnos dice a que hora vuelve a abrir hoy", () => {
    // Martes, 14:30: la panaderia cerro al mediodia y abre por la tarde.
    expect(estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-15T19:30:00Z"))).toEqual({
      abierto: false,
      etiqueta: "Cerrado ahora",
      detalle: "Abre hoy a las 4:00 p. m.",
    });
  });

  it("despues del ultimo turno pasa a mañana", () => {
    // Martes, 21:30 en Iquitos: en UTC ya es miercoles. Si la funcion usara la
    // hora del navegador o UTC, esta prueba diria "abre hoy".
    expect(estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-16T02:30:00Z"))).toEqual({
      abierto: false,
      etiqueta: "Cerrado ahora",
      detalle: "Abre mañana a las 4:00 a. m.",
    });
  });

  it("se salta el domingo, que cierra, y nombra el dia en que abre", () => {
    // Sabado 21:30 en Iquitos (domingo en UTC). El domingo no abre: el proximo
    // turno es el lunes, y hay que decirlo con su nombre.
    expect(estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-20T02:30:00Z"))?.detalle).toBe(
      "Abre el lunes a las 4:00 a. m.",
    );
  });

  it("el domingo entero cuenta como cerrado", () => {
    // Domingo, 9:00: un dia laborable a esa hora estaria abierto.
    const domingo = estadoDelHorario(SEMANA_DE_PIMPOS, new Date("2026-09-20T14:00:00Z"));
    expect(domingo?.abierto).toBe(false);
    expect(domingo?.detalle).toBe("Abre mañana a las 4:00 a. m.");
  });

  it("sin horario cargado no dice nada", () => {
    // Mismo criterio que `agruparHorario`: si la configuracion no llego, callar
    // es mejor que colgarle un "Cerrado ahora" a un negocio que esta abierto.
    expect(estadoDelHorario({}, new Date("2026-09-15T15:00:00Z"))).toBeNull();
  });

  it("si no abre ningun dia tampoco dice nada", () => {
    // Una configuracion con los siete dias vacios no es un negocio cerrado para
    // siempre: es una configuracion a medio cargar.
    const cerrado = Object.fromEntries(Object.keys(SEMANA_DE_PIMPOS).map((dia) => [dia, []]));
    expect(estadoDelHorario(cerrado, new Date("2026-09-15T15:00:00Z"))).toBeNull();
  });
});
