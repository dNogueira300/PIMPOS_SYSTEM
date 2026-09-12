// De `reloj` y no de `configuracion`: este archivo lo usa tambien el boton de
// "Abierto ahora", que es de cliente, y `configuracion` arrastra el cliente de
// Supabase y funciones `use cache` al paquete del navegador.
import { DIAS, formatearHora, type Dia, type Tramo } from "./reloj";

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

/**
 * El horario dice cuando se abre; esto dice si esta abierto AHORA.
 *
 * Sale del P2 de la critica del 12/09: el cliente tenia que leer dos turnos,
 * mirar su reloj y decidir. La panaderia abre a las 4 de la madrugada y cierra
 * al mediodia; a las tres de la tarde, "4:00 a. m. a 1:00 p. m." no responde la
 * unica pregunta que se hace quien quiere pan.
 *
 * Se calcula del horario cargado (decision de Dan, 12/09/2026), no de un
 * interruptor aparte: un interruptor se queda encendido un feriado y miente.
 */
export type EstadoAhora = {
  abierto: boolean;
  /** "Abierto ahora" o "Cerrado ahora". */
  etiqueta: string;
  /** "Hasta la 1:00 p. m.", "Abre mañana a las 4:00 a. m." */
  detalle: string;
};

/**
 * Iquitos, siempre. El negocio esta ahi, y el horario es el suyo: si quien mira
 * la pagina esta en Lima, en Madrid o con el reloj del telefono mal puesto, la
 * panaderia abre igual. Por eso no se usa la hora local del navegador.
 */
const ZONA = "America/Lima";

// `en-US` con `weekday: short` da "Mon".."Sun", que es estable entre motores;
// pedirlo en español devolveria "lun."/"lun" segun la version de ICU.
const DIA_SEGUN_INGLES: Record<string, Dia> = {
  Mon: "lunes",
  Tue: "martes",
  Wed: "miercoles",
  Thu: "jueves",
  Fri: "viernes",
  Sat: "sabado",
  Sun: "domingo",
};

const RELOJ_DE_IQUITOS = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  // `h23` explicito: con `hour12: false` algunos motores escriben "24" a la
  // medianoche, y "24:10" se convierte en un minuto que no existe.
  hourCycle: "h23",
});

/** "04:30" a 270 minutos desde medianoche. `null` si el texto no es una hora. */
function aMinutos(hora: string): number | null {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Que dia es y que hora son en Iquitos, para un instante cualquiera. */
function momentoEnIquitos(ahora: Date): { dia: number; minutos: number } | null {
  const partes = RELOJ_DE_IQUITOS.formatToParts(ahora);
  const leer = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  const dia = DIA_SEGUN_INGLES[leer("weekday")];
  const minutos = aMinutos(`${leer("hour")}:${leer("minute")}`);
  if (dia === undefined || minutos === null) return null;

  return { dia: DIAS.indexOf(dia), minutos };
}

/** "la 1:00 p. m." frente a "las 9:00 p. m.": la una es la unica que va sola. */
function conArticulo(hora: string): string {
  const escrita = formatearHora(hora);
  return `${escrita.startsWith("1:") ? "la" : "las"} ${escrita}`;
}

/**
 * Si el negocio atiende en este instante, y hasta cuando; si no, cuando abre.
 *
 * Devuelve `null` cuando no hay horario cargado o cuando no abre ningun dia de
 * la semana: callar es mejor que decir "Cerrado ahora" porque la configuracion
 * no llego, que es el mismo criterio de `agruparHorario`.
 *
 * `ahora` se recibe, no se lee de dentro: asi la funcion es pura, se prueba con
 * un martes a las diez sin esperar al martes, y no rompe el prerenderizado de
 * Cache Components (un `new Date()` suelto lo tira).
 */
export function estadoDelHorario(
  horario: Readonly<Record<string, readonly Tramo[]>>,
  ahora: Date,
): EstadoAhora | null {
  if (!DIAS.some((dia) => dia in horario)) return null;

  const momento = momentoEnIquitos(ahora);
  if (momento === null) return null;

  const tramosDe = (indice: number) => horario[DIAS[indice % DIAS.length]] ?? [];

  // Abierto: dentro de un turno de hoy. El cierre no cuenta como abierto —a la
  // 1:00 en punto ya no se atiende—, por eso `<` y no `<=`.
  for (const tramo of tramosDe(momento.dia)) {
    const desde = aMinutos(tramo.desde);
    const hasta = aMinutos(tramo.hasta);
    if (desde === null || hasta === null) continue;

    if (momento.minutos >= desde && momento.minutos < hasta) {
      return {
        abierto: true,
        etiqueta: "Abierto ahora",
        detalle: `Hasta ${conArticulo(tramo.hasta)}`,
      };
    }
  }

  // Cerrado: el proximo turno, mirando hoy y los siete dias siguientes. Siete y
  // no seis: un turno mas tarde de hoy tambien es "el proximo".
  for (let salto = 0; salto <= DIAS.length; salto += 1) {
    for (const tramo of tramosDe(momento.dia + salto)) {
      const desde = aMinutos(tramo.desde);
      if (desde === null) continue;
      if (salto === 0 && desde <= momento.minutos) continue;

      const cuando =
        salto === 0
          ? "hoy"
          : salto === 1
            ? "mañana"
            : `el ${NOMBRE_DEL_DIA[DIAS[(momento.dia + salto) % DIAS.length]].toLowerCase()}`;

      return {
        abierto: false,
        etiqueta: "Cerrado ahora",
        detalle: `Abre ${cuando} a ${conArticulo(tramo.desde)}`,
      };
    }
  }

  return null;
}
