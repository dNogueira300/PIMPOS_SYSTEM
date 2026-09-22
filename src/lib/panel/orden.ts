/**
 * Mueve una fila un puesto y devuelve las filas cuyo `orden` hay que escribir.
 *
 * @param ids en el orden en que se ven hoy.
 * @param ordenes los `orden` guardados, en el mismo orden que `ids`. Si faltan
 *   o están repetidos (las semillas dejan muchos en 0), se escriben todos con
 *   su posición: a partir de ahí, cada movimiento toca solo dos filas.
 */
export function reordenar(
  ids: readonly string[],
  id: string,
  hacia: "arriba" | "abajo",
  ordenes?: readonly number[],
): { id: string; orden: number }[] {
  const indice = ids.indexOf(id);
  const destino = hacia === "arriba" ? indice - 1 : indice + 1;
  if (indice === -1 || destino < 0 || destino >= ids.length) return [];

  const nuevos = [...ids];
  [nuevos[indice], nuevos[destino]] = [nuevos[destino]!, nuevos[indice]!];

  const normalizados =
    ordenes !== undefined && ordenes.length === ids.length && ordenes.every((o, i) => o === i);

  const todas = nuevos.map((fila, posicion) => ({ id: fila, orden: posicion }));
  if (ordenes !== undefined && !normalizados) return todas;
  return todas.filter((fila) => fila.id === ids[indice] || fila.id === ids[destino]);
}
