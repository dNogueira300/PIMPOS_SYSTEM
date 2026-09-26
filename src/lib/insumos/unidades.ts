/**
 * Cómo se lee una cantidad de insumo. Solo para ENSEÑAR: convertir y sumar lo
 * hace la base con `numeric` (0011, 0034). Aquí puede usarse `number` porque
 * nada de lo que sale vuelve a la base.
 */
export type UnidadConFactor = { codigo: string; factor: number };

/** Las métricas se escriben abreviadas: «12 kg», nunca «12 kilogramos». */
const ABREVIADAS = new Set(["kg", "g", "l", "ml"]);

export function nombreDeUnidad(codigo: string, cantidad: number): string {
  if (ABREVIADAS.has(codigo) || cantidad === 1) return codigo;
  return /[aeiou]$/.test(codigo) ? `${codigo}s` : `${codigo}es`;
}

/** Hasta dos decimales y sin ceros de sobra: «12.5», «30». Sin separador de miles. */
export function formatearCantidad(n: number): string {
  return String(Number(n.toFixed(2)));
}

/** La unidad de compra más grande del insumo: el saco de la harina, la caja del huevo. */
export function presentacionPrincipal(
  equivalencias: readonly UnidadConFactor[],
): UnidadConFactor | null {
  const mayores = equivalencias.filter((e) => e.factor > 1);
  if (mayores.length === 0) return null;
  return mayores.reduce((a, b) => (b.factor > a.factor ? b : a));
}

/** «62 kg (1 saco y 12 kg)». La presentación solo aparece si llega a una entera. */
export function describirExistencia(
  cantidadBase: number,
  unidadBase: string,
  presentacion: UnidadConFactor | null,
): string {
  const base = `${formatearCantidad(cantidadBase)} ${nombreDeUnidad(unidadBase, cantidadBase)}`;
  if (!presentacion || cantidadBase < presentacion.factor) return base;

  // El 1e-9 evita que 100 / 50 = 1.9999999 cuente un saco de menos.
  const enteras = Math.floor(cantidadBase / presentacion.factor + 1e-9);
  const resto = Number((cantidadBase - enteras * presentacion.factor).toFixed(2));
  const partes = `${enteras} ${nombreDeUnidad(presentacion.codigo, enteras)}`;
  return resto > 0
    ? `${base} (${partes} y ${formatearCantidad(resto)} ${nombreDeUnidad(unidadBase, resto)})`
    : `${base} (${partes})`;
}
