export type AvisoCorreo = { tipo: string; titulo: string; mensaje: string };

/** El orden de los grupos: lo que espera una decisión va primero. */
const GRUPOS: ReadonlyArray<{ nombre: string; tipos: readonly string[] }> = [
  { nombre: "Por aprobar", tipos: ["baja_pendiente", "promocion_en_revision"] },
  { nombre: "Vencido", tipos: ["vencido"] },
  { nombre: "Por vencer", tipos: ["por_vencer"] },
  { nombre: "Stock bajo", tipos: ["stock_bajo"] },
];
const CONOCIDOS = new Set(GRUPOS.flatMap((g) => g.tipos));

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * El resumen diario, en texto y en HTML. Un tipo de aviso que se añada a la
 * base sin tocar esta lista va en «Otros avisos»: el asunto los cuenta todos,
 * y el cuerpo tiene que enseñar todos los que cuenta (se marcan como enviados).
 */
export function armarResumen(avisos: AvisoCorreo[], fecha: string) {
  const grupos = [
    ...GRUPOS.map((g) => ({
      nombre: g.nombre,
      avisos: avisos.filter((a) => g.tipos.includes(a.tipo)),
    })),
    { nombre: "Otros avisos", avisos: avisos.filter((a) => !CONOCIDOS.has(a.tipo)) },
  ].filter((g) => g.avisos.length > 0);

  const asunto = `Pimpo's: ${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"} del ${fecha}`;
  const texto = grupos
    .map((g) => [`${g.nombre}:`, ...g.avisos.map((a) => `- ${a.titulo}. ${a.mensaje}`)].join("\n"))
    .join("\n\n");
  const html = grupos
    .map(
      (g) =>
        `<h2 style="color:#12306E;font-family:Georgia,serif">${escapar(g.nombre)}</h2><ul>${g.avisos
          .map((a) => `<li><strong>${escapar(a.titulo)}.</strong> ${escapar(a.mensaje)}</li>`)
          .join("")}</ul>`,
    )
    .join("");
  return { asunto, texto, html };
}
