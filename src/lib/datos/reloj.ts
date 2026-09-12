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
