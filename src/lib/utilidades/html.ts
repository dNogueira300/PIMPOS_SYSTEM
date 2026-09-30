/**
 * Texto escrito por una persona, listo para meterlo en HTML que se pinta con
 * `innerHTML` (los globos de Leaflet). Un nombre de cliente con `<img onerror>`
 * se ejecutaba en la sesión de quien abría la ficha (revisión de F6, T3–T4).
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
