/**
 * Contraste segun WCAG 2.1. La accesibilidad AA es un minimo del proyecto
 * (doc 03 §3.4), y un minimo que no se puede comprobar no es un minimo.
 */

/** Umbrales AA por tipo de contenido. */
export const AA = {
  /** Texto normal, por debajo de 18 px (o 14 px en negrita). */
  texto: 4.5,
  /** Texto grande: 18 px o mas, o 14 px en negrita. */
  textoGrande: 3,
  /** Bordes de controles, iconos con significado y otros elementos no textuales. */
  interfaz: 3,
} as const;

/** Convierte `#RGB` o `#RRGGBB` a sus tres canales 0–255. */
export function aCanales(color: string): [number, number, number] {
  const limpio = color.trim().replace(/^#/, "");

  const completo =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;

  if (!/^[0-9a-fA-F]{6}$/.test(completo)) {
    throw new Error(`No es un color hexadecimal valido: "${color}"`);
  }

  return [
    parseInt(completo.slice(0, 2), 16),
    parseInt(completo.slice(2, 4), 16),
    parseInt(completo.slice(4, 6), 16),
  ];
}

/** Luminancia relativa (WCAG 2.1, definicion de `relative luminance`). */
export function luminancia(color: string): number {
  const [r, g, b] = aCanales(color).map((canal) => {
    const proporcion = canal / 255;
    return proporcion <= 0.03928 ? proporcion / 12.92 : Math.pow((proporcion + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Relacion de contraste entre dos colores, de 1 (identicos) a 21 (negro sobre
 * blanco). El orden de los argumentos da igual.
 */
export function contraste(unColor: string, otroColor: string): number {
  const a = luminancia(unColor);
  const b = luminancia(otroColor);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);

  return (claro + 0.05) / (oscuro + 0.05);
}

/** true si el par alcanza el umbral AA indicado. */
export function cumpleAA(frente: string, fondo: string, umbral: number = AA.texto): boolean {
  return contraste(frente, fondo) >= umbral;
}
