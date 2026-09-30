/**
 * El texto que se le lee al cliente antes de registrarlo (decisión 5, Ley
 * N.° 29733). Vive en el código y no en la configuración: un texto legal
 * cambiado por error cambiaría lo que «aceptó» cada cliente. La base guarda
 * la VERSIÓN que se leyó (`consentimientos.texto_version`).
 *
 * Cambiar el texto = versión nueva + su huella en `permiso.test.ts`.
 */
export const VERSION_PERMISO = "v1-2026-10";

export const PLANTILLA_PERMISO =
  "Para llevarle sus pedidos, Panadería Pimpo's guardará su nombre, su celular, su dirección con una referencia, la ubicación de su casa y hasta tres fotos de la fachada. Solo los ve el personal de la panadería y no se comparten con nadie. Los guardamos mientras sea nuestro cliente; si pasan dos años sin que su ficha se use, los revisamos para borrarlos. Puede pedir en cualquier momento que los corrijamos o los borremos, llamando o escribiendo al {celular}. ¿Está de acuerdo?";

/** El número del negocio sale de la configuración (`numeroParaLeer(config.whatsapp)`). */
export function textoDelPermiso(celularNegocio: string): string {
  return PLANTILLA_PERMISO.replace("{celular}", celularNegocio);
}
