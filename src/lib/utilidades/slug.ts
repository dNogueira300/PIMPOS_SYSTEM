/**
 * Convierte un texto en un slug apto para URL: `Pan Francés Chico` → `pan-frances-chico`.
 *
 * Las URLs del sitio van en espanol y legibles (doc 03 §4.4), asi que hay que
 * quitar tildes y enes sin destrozar la palabra: `Ñoño` → `nono`, no `-o-o`.
 */
export function generarSlug(texto: string): string {
  return (
    texto
      // Separa cada letra de su acento (NFD) y descarta los acentos sueltos,
      // que en Unicode ocupan el bloque U+0300–U+036F.
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      // Todo lo que no sea letra o numero pasa a ser un separador.
      .replace(/[^a-z0-9]+/g, "-")
      // Sin guiones en los extremos.
      .replace(/^-+|-+$/g, "")
  );
}
