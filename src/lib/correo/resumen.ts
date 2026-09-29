export type AvisoCorreo = { tipo: string; titulo: string; mensaje: string };

/** El orden de los grupos: lo que espera una decisión va primero. */
const GRUPOS: ReadonlyArray<{ nombre: string; tipos: readonly string[] }> = [
  { nombre: "Por aprobar", tipos: ["baja_pendiente", "promocion_en_revision"] },
  { nombre: "Vencido", tipos: ["vencido"] },
  { nombre: "Por vencer", tipos: ["por_vencer"] },
  { nombre: "Stock bajo", tipos: ["stock_bajo"] },
];
const CONOCIDOS = new Set(GRUPOS.flatMap((g) => g.tipos));

/**
 * Los avisos de insumos que se repiten: `pg_cron` crea uno nuevo cada día
 * mientras dure la situación (la clave lleva la fecha, 0015).
 */
const REPETIDOS_CADA_DIA = new Set(["stock_bajo", "por_vencer", "vencido"]);

/**
 * De los avisos de insumos, solo el más reciente de cada insumo (y lote) y
 * tipo. Mientras el correo esté apagado se acumula uno por día; al encenderlo,
 * el primer resumen repetiría «Queda poco Harina» una vez por cada día, con
 * cantidades viejas. Los que esperan una decisión (bajas, promociones) se
 * quedan todos: cada uno es otra solicitud. Espera los avisos en orden de
 * llegada y lo conserva.
 */
export function avisosVigentes<
  T extends AvisoCorreo & { insumo_id: string | null; lote_id: string | null },
>(avisos: T[]): T[] {
  const ultimo = new Map<string, number>();
  avisos.forEach((a, i) => {
    if (REPETIDOS_CADA_DIA.has(a.tipo)) ultimo.set(`${a.tipo}|${a.insumo_id}|${a.lote_id}`, i);
  });
  return avisos.filter(
    (a, i) =>
      !REPETIDOS_CADA_DIA.has(a.tipo) || ultimo.get(`${a.tipo}|${a.insumo_id}|${a.lote_id}`) === i,
  );
}

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
