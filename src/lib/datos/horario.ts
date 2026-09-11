import { DIAS, type Dia, type Tramo } from "./configuracion";

export const NOMBRE_DEL_DIA: Record<Dia, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export type GrupoDeDias = {
  /** "Lunes a sábado", "Sábado y domingo" o un solo dia. */
  dias: string;
  /** Vacio significa cerrado. */
  tramos: Tramo[];
};

function mismosTurnos(a: readonly Tramo[], b: readonly Tramo[]): boolean {
  return (
    a.length === b.length &&
    a.every((tramo, i) => tramo.desde === b[i].desde && tramo.hasta === b[i].hasta)
  );
}

// Dos dias se unen con "y" y tres o mas con "a": "Sábado a domingo" suena a un
// rango largo, y asi no lo diria nadie en el mostrador.
function nombrar(primero: Dia, ultimo: Dia, cuantos: number): string {
  if (cuantos === 1) return NOMBRE_DEL_DIA[primero];
  const hasta = NOMBRE_DEL_DIA[ultimo].toLowerCase();
  return `${NOMBRE_DEL_DIA[primero]} ${cuantos === 2 ? "y" : "a"} ${hasta}`;
}

/**
 * El horario de la semana en grupos de dias seguidos que abren igual.
 *
 * Una fila por dia eran siete filas casi identicas (critica de diseno del
 * 11/09): de lunes a sabado se abre igual y el domingo se cierra. Son dos
 * datos, y asi se leen.
 *
 * Solo se juntan dias seguidos: si el miercoles cerrara, "Lunes a sábado"
 * diria que tambien abre. Un dia que falta en la configuracion cuenta como
 * cerrado, pero si no hay ninguno cargado no se devuelve nada: decir "Lunes a
 * domingo: cerrado" porque la configuracion no llego seria peor que callar.
 */
export function agruparHorario(horario: Readonly<Record<string, readonly Tramo[]>>): GrupoDeDias[] {
  if (!DIAS.some((dia) => dia in horario)) return [];

  const grupos: { primero: Dia; ultimo: Dia; cuantos: number; tramos: Tramo[] }[] = [];

  for (const dia of DIAS) {
    const tramos = [...(horario[dia] ?? [])];
    const anterior = grupos.at(-1);

    if (anterior && mismosTurnos(anterior.tramos, tramos)) {
      anterior.ultimo = dia;
      anterior.cuantos += 1;
    } else {
      grupos.push({ primero: dia, ultimo: dia, cuantos: 1, tramos });
    }
  }

  return grupos.map(({ primero, ultimo, cuantos, tramos }) => ({
    dias: nombrar(primero, ultimo, cuantos),
    tramos,
  }));
}
