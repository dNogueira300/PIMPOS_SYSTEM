/**
 * Un error de la base no puede desaparecer en silencio.
 *
 * Las lecturas del sitio publico devuelven una lista vacia cuando la consulta
 * falla, y eso esta bien para la pagina: es preferible una seccion vacia a una
 * pagina caida. Lo que no puede ser es que nadie se entere.
 *
 * Pasó en el primer despliegue: el build se cayo con «all
 * `generateStaticParams` functions must return at least one result», que no
 * menciona la base por ningun lado. El mensaje util —el que dice si falta una
 * columna, si la RLS niega la lectura o si la tabla esta vacia— lo tenia
 * PostgREST y se tiraba a la basura una linea antes.
 *
 * Es la misma leccion que ya estaba escrita para los guiones de verificacion:
 * una comprobacion que solo dice "fallo" cuesta mas de lo que ahorra. El
 * mensaje del servidor no lleva secretos; lo que lleva es la causa.
 */
type ErrorDeConsulta = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * Deja el error en el registro del servidor (o del build) y dice que se
 * devuelve en su lugar. No lanza: quien lo llama decide si sigue o no.
 */
export function avisarDeConsulta(consulta: string, error: ErrorDeConsulta | null): void {
  if (!error) return;

  const partes = [
    `[datos] ${consulta} no devolvió nada.`,
    error.code ? `código ${error.code}:` : "",
    error.message,
    error.hint ? `Pista: ${error.hint}` : "",
    error.details ? `Detalle: ${error.details}` : "",
  ].filter((parte) => parte.length > 0);

  console.error(partes.join(" "));
}
