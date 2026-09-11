import { describe, expect, it } from "vitest";

import { agruparHorario } from "./horario";

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
