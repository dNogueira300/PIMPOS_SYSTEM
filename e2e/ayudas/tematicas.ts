import { sqlLocal } from "./base";

/**
 * Aparta las demás temáticas mientras una prueba enciende `slug`.
 *
 * Encender una temática a mano vale «desde hoy hasta su fin», y la base no deja
 * que dos se crucen (0047): según el día en que corra la prueba, las fechas de
 * fábrica de otra (el Día de la Madre en abril, Navidad en diciembre) harían
 * que el panel respondiera «Las fechas se cruzan con…» sin que nada estuviera
 * roto. Las lleva lejos (dentro de un año, sin fecha de la fiesta) y devuelve
 * una función que las deja como estaban. Esa función se llama al final, DESPUÉS
 * de devolver la temática probada a sus fechas: si no, podría cruzarse con ella.
 *
 * Solo prepara datos: lo que la prueba comprueba se enciende desde el panel.
 */
export function apartarLasDemas(slug: string): () => void {
  const filas = sqlLocal(
    `select concat_ws('|', slug, inicio, fin, coalesce(fecha_evento::text, ''))
       from public.tematicas where slug <> '${slug}' order by slug`,
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((linea) => linea.trim().split("|"));

  for (const [otra] of filas) {
    sqlLocal(`
      update public.tematicas
         set inicio = ((now() at time zone 'America/Lima')::date + 400),
             fin = ((now() at time zone 'America/Lima')::date + 410),
             fecha_evento = null
       where slug = '${otra}';
    `);
  }

  return () => {
    for (const [otra, inicio, fin, evento] of filas) {
      sqlLocal(`
        update public.tematicas
           set encendido = 'fechas', inicio = '${inicio}', fin = '${fin}',
               fecha_evento = nullif('${evento}', '')::date
         where slug = '${otra}';
      `);
    }
  };
}
