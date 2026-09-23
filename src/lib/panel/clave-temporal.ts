/**
 * Contraseña temporal para dársela a alguien en persona o por WhatsApp
 * (decisión 6). Sin 0/O, 1/l/I: se lee de una pantalla y se escribe a mano en
 * otra. Con mayúscula, minúscula y número, por si el proyecto alojado exige
 * esos requisitos aunque el local no.
 *
 * Nunca se guarda ni se registra: la acción la devuelve una vez a la pantalla
 * y ahí termina.
 */
const MAYUSCULAS = "ABCDEFGHJKMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const NUMEROS = "23456789";
export const ALFABETO_CLAVE = MAYUSCULAS + MINUSCULAS + NUMEROS;

const LARGO = 12;
const OBLIGATORIAS = [MAYUSCULAS, MINUSCULAS, NUMEROS] as const;

type Azar = (n: number) => Uint32Array;
const azarSeguro: Azar = (n) => crypto.getRandomValues(new Uint32Array(n));

/**
 * @param azar de dónde sale el azar; en producción, `crypto.getRandomValues`.
 *   Las pruebas le pasan uno fijo para que el resultado no dependa de la suerte.
 */
export function generarClaveTemporal(azar: Azar = azarSeguro): string {
  // LARGO para los caracteres, y dos por cada clase obligatoria: uno elige la
  // posición y otro el carácter.
  const valores = azar(LARGO + OBLIGATORIAS.length * 2);
  const leer = (i: number) => valores[i] ?? 0;
  const tomar = (alfabeto: string, i: number) => alfabeto[leer(i) % alfabeto.length] ?? "";

  const caracteres = Array.from({ length: LARGO }, (_, i) => tomar(ALFABETO_CLAVE, i));

  // Una posición distinta para cada clase obligatoria (Fisher-Yates parcial),
  // así ninguna pisa a otra.
  const posiciones = Array.from({ length: LARGO }, (_, i) => i);
  for (let k = 0; k < OBLIGATORIAS.length; k++) {
    const j = k + (leer(LARGO + k) % (LARGO - k));
    const elegida = posiciones[j]!;
    posiciones[j] = posiciones[k]!;
    posiciones[k] = elegida;
    caracteres[elegida] = tomar(OBLIGATORIAS[k]!, LARGO + OBLIGATORIAS.length + k);
  }

  return caracteres.join("");
}
