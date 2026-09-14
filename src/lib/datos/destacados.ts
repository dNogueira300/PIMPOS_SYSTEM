import type { ProductoPublico } from "./catalogo";

/** Una fila de tarjetas en escritorio. */
const MAXIMO_TARJETAS = 4;

/**
 * Reparte los destacados de la portada: los que tienen foto real van en
 * tarjeta; el resto, en la pizarra. Decisión de Dan (13/09/2026) sobre el
 * prototipo de Stitch, que ponía todos en tarjeta.
 *
 * Cuando el negocio suba fotos desde el panel (F4), las tarjetas crecen solas.
 *
 * Sin dependencias a propósito, como `reloj.ts`: se prueba sin base.
 */
export function repartirPorFoto(productos: readonly ProductoPublico[]): {
  conFoto: (ProductoPublico & { imagen: string })[];
  sinFoto: ProductoPublico[];
} {
  const conFoto = productos
    .filter((p): p is ProductoPublico & { imagen: string } => Boolean(p.imagen))
    .slice(0, MAXIMO_TARJETAS);
  const enTarjeta = new Set(conFoto.map((p) => p.id));
  return { conFoto, sinFoto: productos.filter((p) => !enTarjeta.has(p.id)) };
}
