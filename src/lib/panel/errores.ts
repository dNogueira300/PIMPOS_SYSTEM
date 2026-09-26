/**
 * Lo que responde PostgREST cuando algo falla, traducido a una frase que dice
 * qué hacer (doc 03 §5.1). Lo usan todas las acciones del panel a través de
 * `ejecutarAccion()`; el mensaje original se deja en el registro del servidor.
 */
export type ErrorDePostgres = {
  code?: string;
  message: string;
  hint?: string | null;
  details?: string | null;
};

/** Un mensaje escrito por Postgres, no por nosotros. Esos no se enseñan. */
function esMensajeDePostgres(mensaje: string): boolean {
  return /violates|constraint|relation "|syntax|permission denied/i.test(mensaje);
}

/**
 * @param entidad con su artículo, tal como encaja en la frase: «un producto»,
 *   «la categoría».
 */
export function traducirError(error: ErrorDePostgres, entidad: string): string {
  switch (error.code) {
    case "23505":
      return `Ya hay ${entidad} con ese nombre. Cámbialo e inténtalo otra vez.`;
    case "42501":
      return "Tu rol no permite hacer esto. Si crees que debería, habla con un administrador.";
    case "23503":
      return `No se puede: ${entidad} todavía se usa en otra parte.`;
    case "PGRST116":
      return `No se encontró ${entidad}. Puede que otra persona lo haya borrado.`;
    case "23514":
    case "P0001":
    case "P0002":
      // Los triggers y funciones del proyecto escriben su `message` para
      // personas (p. ej. 0010, 0011). Los checks de columna, no.
      return esMensajeDePostgres(error.message)
        ? "Algún dato no cumple las reglas. Revisa lo que escribiste."
        : error.message;
    default:
      return "No se pudo guardar. Revisa tu conexión e inténtalo otra vez.";
  }
}
