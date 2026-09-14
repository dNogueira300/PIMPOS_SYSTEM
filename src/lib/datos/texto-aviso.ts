/**
 * El texto de la barra de aviso de arriba del todo, a partir de datos reales.
 *
 * El prototipo de Stitch decía «Horneamos desde las 4:00 AM · Envíos a todo
 * Iquitos por WhatsApp», escrito a mano. Aquí se arma con la hora de apertura y
 * las zonas de reparto que tiene la base: así no puede contradecir a la tabla de
 * horarios ni al bloque de delivery si el negocio los cambia desde el panel.
 *
 * Se llama `texto-aviso` y no `aviso` porque `aviso.ts` ya existe y es otra cosa:
 * el registro de errores de las consultas (`avisarDeConsulta`).
 *
 * Sin dependencias a propósito: si algún día lo usa un componente de cliente, no
 * debe arrastrar Supabase ni `use cache` (ver la trampa de `reloj.ts` en
 * CLAUDE.md).
 */
export function textoDelAviso({
  abreALas,
  zonas,
}: {
  abreALas: string | null;
  zonas: string;
}): string | null {
  const partes = [
    abreALas ? `Abrimos a las ${abreALas}` : null,
    zonas.trim() ? `Delivery a ${zonas.trim()}` : null,
  ].filter((parte): parte is string => parte !== null);

  return partes.length > 0 ? partes.join(" · ") : null;
}
