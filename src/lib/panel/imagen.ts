/** 20 MB: por encima, comprimir en un celular modesto se cuelga. */
const MAXIMO_BYTES = 20 * 1024 * 1024;

export function validarArchivo(archivo: { type: string; size: number }): string | null {
  if (!archivo.type.startsWith("image/")) {
    return "Ese archivo no es una foto. Elige una imagen (JPG, PNG o WebP).";
  }
  if (archivo.size > MAXIMO_BYTES) {
    return "La foto pesa más de 20 MB. Elige otra o tómala con menos calidad.";
  }
  return null;
}

/**
 * Las filas guardan la ruta dentro del bucket, nunca la URL (ver
 * `urlDeImagen`). El id es un uuid nuevo por subida: reemplazar una foto no
 * pisa la anterior, así que una página ya cacheada no enseña una imagen que
 * cambió por debajo.
 */
export function rutaDeSubida(carpeta: string, id: string, extension = "webp"): string {
  const limpia = carpeta.replace(/^\/+|\/+$/g, "");
  return `${limpia}/${id}.${extension}`;
}
