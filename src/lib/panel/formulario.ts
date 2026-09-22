/**
 * Lectura de campos de un `FormData`. Solo convierte; valida Zod después.
 * Los formularios del panel son nativos (sin react-hook-form), así que lo que
 * llega a la acción es siempre texto.
 */
function crudo(fd: FormData, nombre: string): string {
  const valor = fd.get(nombre);
  return typeof valor === "string" ? valor : "";
}

export function texto(fd: FormData, nombre: string): string {
  return crudo(fd, nombre).trim();
}

export function textoOpcional(fd: FormData, nombre: string): string | null {
  const valor = texto(fd, nombre);
  return valor === "" ? null : valor;
}

export function casilla(fd: FormData, nombre: string): boolean {
  return crudo(fd, nombre) === "on";
}

export function entero(fd: FormData, nombre: string): number | null {
  const valor = texto(fd, nombre);
  return /^-?\d+$/.test(valor) ? Number(valor) : null;
}

export function json(fd: FormData, nombre: string): unknown {
  try {
    return JSON.parse(crudo(fd, nombre));
  } catch {
    return null;
  }
}
