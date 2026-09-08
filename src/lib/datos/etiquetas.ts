/**
 * Etiquetas de cache del sitio publico.
 *
 * Cada lectura del sitio se marca con una de estas, y el panel invalida por
 * etiqueta cuando publica algo (`revalidateTag(ETIQUETAS.catalogo, "max")`).
 * Sin ellas, la unica forma de refrescar seria esperar a que caduque el tiempo,
 * y el negocio no entenderia por que su producto nuevo no aparece.
 *
 * Son POCAS a proposito. Una etiqueta por tabla obligaria a acordarse de cual
 * toca en cada accion del panel, y el dia que alguien olvide una, la pagina se
 * queda vieja sin que nadie lo note. Con cuatro grupos grandes, invalidar de
 * mas cuesta un renderizado; invalidar de menos cuesta un error invisible.
 */
export const ETIQUETAS = {
  /** Productos, variantes, precios, categorias y sus fotos. */
  catalogo: "catalogo",
  /** Novedades, promociones y los slides de portada: lo que caduca. */
  novedades: "novedades",
  /** Galeria, faqs, guias y testimonios. */
  contenido: "contenido",
  /** Logo, favicon, horarios, telefonos, coordenadas y textos (R21). */
  marca: "marca",
} as const;

export type Etiqueta = (typeof ETIQUETAS)[keyof typeof ETIQUETAS];
