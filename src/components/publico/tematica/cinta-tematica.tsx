/**
 * La cinta de mensajes de la temática (plan 08, T4), bajo la franja de la
 * portada. Se desliza en bucle con dos copias de la lista; la segunda va con
 * `aria-hidden` para que un lector de pantalla la lea una sola vez. Con «menos
 * movimiento» se queda quieta, envuelve en varias líneas y la copia no sale
 * (ver `.cinta-tematica` en tematicas.css).
 */
export function CintaTematica({ mensajes, nombre }: { mensajes: string[]; nombre: string }) {
  if (mensajes.length === 0) return null;
  // Con pocos mensajes, una copia no llena el ancho de una pantalla grande y el
  // bucle dejaría un hueco: se repiten hasta tener al menos seis.
  const repeticiones = Math.ceil(6 / mensajes.length);
  const lista = Array.from({ length: repeticiones }, () => mensajes).flat();

  return (
    <section aria-label={`Mensajes de ${nombre}`} className="cinta-tematica" data-cinta-tematica>
      <div className="cinta-tematica__pista">
        <ul>
          {mensajes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
          {lista.slice(mensajes.length).map((m, i) => (
            <li key={`r${i}`} aria-hidden>
              {m}
            </li>
          ))}
        </ul>
        <ul aria-hidden>
          {lista.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
