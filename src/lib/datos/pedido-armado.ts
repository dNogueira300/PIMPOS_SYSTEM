/**
 * El mensaje de «Arma tu pedido» (prototipo de Stitch, plan 03.1 tarea 8).
 *
 * No choca con la decisión de F3 de no poner formulario de contacto: aquella
 * era porque nadie vigila un buzón. Este no manda nada a ningún sitio ni guarda
 * datos: arma el texto y abre WhatsApp, que es por donde el negocio ya pide.
 *
 * Vive aparte de `pedido.ts` y sin dependencias a propósito: lo usa un
 * componente de cliente, y `pedido.ts` importa `catalogo.ts`, que trae Supabase
 * y funciones `use cache`. Es la trampa de `reloj.ts` (CLAUDE.md): el build se
 * cae, y la traza no lo dice en ese orden.
 */

export type PedidoArmado = { nombre: string; zona: string; hora: string; productos: string };

export function mensajeArmado(pedido: PedidoArmado): string | null {
  const productos = pedido.productos.trim();
  if (!productos) return null;

  const datos = (
    [
      ["Nombre", pedido.nombre],
      ["Zona", pedido.zona],
      ["Hora de entrega", pedido.hora],
    ] as const
  )
    .map(([etiqueta, valor]) => [etiqueta, valor.trim()] as const)
    .filter(([, valor]) => valor.length > 0)
    .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`);

  return [
    "Hola, quiero hacer un pedido.",
    ...(datos.length > 0 ? [datos.join("\n")] : []),
    `Pedido:\n${productos}`,
  ].join("\n\n");
}
