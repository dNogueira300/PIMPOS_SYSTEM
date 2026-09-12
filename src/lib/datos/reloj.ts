/**
 * Los dias, las horas y como se escriben. Sin dependencias.
 *
 * Vivia dentro de `configuracion.ts`, que trae consigo Zod, el cliente de
 * Supabase y funciones `use cache`. Mientras solo lo leia el servidor daba
 * igual; en cuanto el boton de "Abierto ahora" —que es de cliente por fuerza,
 * depende de que hora es— importo `horario.ts`, el build se cayo con
 * «It is not allowed to define inline "use cache" annotated functions in Client
 * Components»: la cadena de importaciones arrastraba la configuracion entera al
 * paquete del navegador.
 *
 * Asi que lo puro se separa de lo que habla con la base. `configuracion.ts`
 * reexporta todo esto, de modo que quien ya lo importaba de alli sigue igual.
 */

/** Los siete dias, en el orden en que se leen. `domingo: []` significa cerrado. */
export const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type Dia = (typeof DIAS)[number];

/** Un turno de atencion: `{ desde: "04:00", hasta: "13:00" }`. */
export type Tramo = { desde: string; hasta: string };

/** `04:00` a `4:00 a. m.`, como lo lee alguien que no programa. */
export function formatearHora(hora: string): string {
  const [h, m] = hora.split(":").map(Number);

  // `Number.isFinite`, no `Number.isNaN`: con la cadena vacia, `split` devuelve
  // un solo elemento, `m` llega `undefined`, y `Number.isNaN(undefined)` es
  // false. La version anterior daba por buena esa entrada y escribia
  // "12:undefined a. m." en el pie de todas las paginas.
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hora;

  const sufijo = h < 12 ? "a. m." : "p. m.";
  const doce = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${doce}:00 ${sufijo}` : `${doce}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** "4:00 a. m. a 1:00 p. m. y 4:00 p. m. a 9:00 p. m." o "Cerrado". */
export function describirTramos(tramos: readonly Tramo[]): string {
  if (tramos.length === 0) return "Cerrado";
  return tramos
    .map(({ desde, hasta }) => `${formatearHora(desde)} a ${formatearHora(hasta)}`)
    .join(" y ");
}

/**
 * Cuantos anios lleva abierto el negocio.
 *
 * Existe porque "22 anios" y "Veintidos anios" estaban escritos a mano en la
 * portada y en la pagina de nosotros. Un numero asi no falla: el 1 de enero
 * siguiente pasa a mentir, en las cuatro frases a la vez, sin que ninguna
 * prueba salte ni nadie lo note. La cuenta se calcula; lo unico que se guarda
 * es el anio de apertura, que ese si es fijo (0024).
 *
 * Devuelve `null` si los datos no permiten una cuenta creible —anio de
 * apertura ausente, en el futuro, o absurdo—, para que quien llama escriba la
 * frase sin el numero en vez de publicar "0 anios" o "-3 anios".
 */
export function anosDeOficio(anioActual: number, anioFundacion: number): number | null {
  if (!Number.isFinite(anioActual) || !Number.isFinite(anioFundacion)) return null;
  if (anioFundacion < 1900 || anioFundacion > anioActual) return null;

  const anos = anioActual - anioFundacion;
  return anos > 0 ? anos : null;
}

/**
 * Del 21 al 29 la palabra va contraida y con sus tildes propias —veintidos NO,
 * veintidós SI; veinticuatro sin tilde—, asi que se escriben una a una. De 30
 * en adelante son tres palabras ("treinta y dos") y ahi la tilde desaparece,
 * asi que se arman.
 */
const VEINTI = [
  "veinte",
  "veintiún",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
] as const;

const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta"] as const;
const UNIDADES = [
  "",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
] as const;

/**
 * El numero en letra para un titular: 22 -> "Veintidós".
 *
 * El titular de la portada dice "Veintidós años en el barrio", con la palabra
 * escrita. Poner "22" ahi seria un titular peor, asi que la palabra se genera
 * en vez de escribirla a mano, que es lo que la dejaba envejecer.
 *
 * Cubre de 21 a 59, que es donde va a estar este negocio durante la vida util
 * de este codigo. Fuera de ahi devuelve la cifra: feo, pero nunca falso.
 */
export function enLetra(n: number): string {
  if (!Number.isInteger(n) || n < 21 || n > 59) return String(n);

  const decena = Math.floor(n / 10);
  const unidad = n % 10;
  const palabra =
    decena === 2
      ? VEINTI[unidad]
      : unidad === 0
        ? DECENAS[decena]
        : `${DECENAS[decena]} y ${UNIDADES[unidad]}`;

  return palabra.charAt(0).toUpperCase() + palabra.slice(1);
}
