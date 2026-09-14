/**
 * "María Luisa Pérez" → "MP", para el círculo de un testimonio (plan 03.1,
 * tarea 7).
 *
 * El primer y el último nombre, como se firma: con tres o cuatro palabras, las
 * cuatro letras no caben en el círculo y ninguna persona se reconoce en ellas.
 * Se trabaja por letras y no por el primer carácter, para que un «C. Ríos»
 * no deje el punto dentro.
 */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .map((palabra) => palabra.match(/\p{L}/u)?.[0] ?? "")
    .filter((letra) => letra.length > 0);

  if (palabras.length === 0) return "";
  const letras = palabras.length === 1 ? [palabras[0]] : [palabras[0], palabras.at(-1)!];
  return letras.join("").toLocaleUpperCase("es");
}
