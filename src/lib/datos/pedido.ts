import { describirPresentacion, formatearPrecio, type ProductoPublico } from "./catalogo";
import type { Configuracion } from "./configuracion";

/**
 * Lo que un cliente tiene que saber antes de pedir por WhatsApp.
 *
 * Nace de la critica de diseno del 11/09/2026: el boton "Pedir por WhatsApp"
 * era un salto a ciegas. El vecino no sabia cuanto costaba el envio, si su
 * pedido llegaba al minimo ni que tenia que escribir, asi que escribia para
 * preguntarlo, o no escribia.
 *
 * Funciones puras sobre la configuracion: se prueban sin base y sin navegador.
 */

/**
 * El `slug` de la guia "Cómo hacer un pedido" (migracion 0010).
 *
 * Quien la enlaza la busca antes entre las guias publicadas, en vez de enlazar
 * a ciegas: si el negocio la renombra o la retira, el enlace desaparece en
 * lugar de llevar a un ancla que no existe.
 */
export const GUIA_DEL_PEDIDO = "como-hacer-un-pedido";

type DatosDelPedido = Pick<
  Configuracion,
  "delivery_zonas" | "delivery_costo" | "pedido_minimo" | "delivery_tiempo" | "formas_pago"
>;

export type Condicion = {
  clave: "costo" | "minimo" | "tiempo" | "pago" | "zonas";
  etiqueta: string;
  valor: string;
};

// `Intl.ListFormat` y no un `join(", ")` con la ultima coma cambiada a mano:
// el castellano pide "Belén e Iquitos" y "Yape u Otro", y eso ya lo sabe ICU.
const CON_Y = new Intl.ListFormat("es", { style: "long", type: "conjunction" });
const CON_O = new Intl.ListFormat("es", { style: "long", type: "disjunction" });

// El panel lo edita una persona: una linea en blanco no es una zona.
function sinHuecos(partes: readonly string[]): string[] {
  return partes.map((parte) => parte.trim()).filter((parte) => parte.length > 0);
}

/** "Iquitos, Belén, Punchana y San Juan Bautista". */
export function unirConY(partes: readonly string[]): string {
  return CON_Y.format(sinHuecos(partes));
}

/** "Efectivo, Yape o Plin". */
export function unirConO(partes: readonly string[]): string {
  return CON_O.format(sinHuecos(partes));
}

/**
 * Las condiciones del delivery, en el orden en que aparece la duda.
 *
 * Lo que el negocio no cargo no sale: sin dato no hay linea. Y un minimo de
 * cero tampoco, porque "Pedido mínimo: S/ 0.00" parece un error.
 */
export function condicionesDelPedido(datos: DatosDelPedido): Condicion[] {
  const condiciones: Condicion[] = [];

  if (datos.delivery_costo !== null) {
    condiciones.push({
      clave: "costo",
      etiqueta: "Delivery",
      valor: datos.delivery_costo === 0 ? "Gratis" : formatearPrecio(datos.delivery_costo),
    });
  }

  if (datos.pedido_minimo !== null && datos.pedido_minimo > 0) {
    condiciones.push({
      clave: "minimo",
      etiqueta: "Pedido mínimo",
      valor: formatearPrecio(datos.pedido_minimo),
    });
  }

  const tiempo = datos.delivery_tiempo.trim();
  if (tiempo.length > 0) {
    condiciones.push({ clave: "tiempo", etiqueta: "Llega en", valor: tiempo });
  }

  const pago = unirConO(datos.formas_pago);
  if (pago.length > 0) {
    condiciones.push({ clave: "pago", etiqueta: "Pagas con", valor: pago });
  }

  const zonas = unirConY(datos.delivery_zonas);
  if (zonas.length > 0) {
    condiciones.push({ clave: "zonas", etiqueta: "Repartimos en", valor: zonas });
  }

  return condiciones;
}

/**
 * El numero de WhatsApp como se dicta: "947 874 820".
 *
 * En la base va con el codigo de pais y sin espacios, que es lo que exige
 * wa.me. Escrito asi en la pagina, "51947874820" parece un numero equivocado, y
 * quien prefiere guardarlo en sus contactos no sabe por donde partirlo.
 */
export function numeroParaLeer(whatsapp: string): string | null {
  const digitos = whatsapp.replace(/\D/g, "");
  if (digitos.length === 0) return null;

  // 51 y nueve digitos que empiezan por 9: un celular peruano.
  const nacional = digitos.length === 11 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
  if (/^9\d{8}$/.test(nacional)) return nacional.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");

  // Cualquier otro se deja entero y con su codigo: partirlo seria adivinar.
  return `+${digitos}`;
}

/**
 * El mensaje que llega escrito al abrir WhatsApp.
 *
 * Deja el hueco para los dos datos sin los que no se despacha un pedido:
 * cuanto y a donde. Antes decia solo "quisiera pedir X", y la primera
 * respuesta del negocio era siempre la misma pregunta.
 */
export function mensajeDePedido(
  producto?: Pick<ProductoPublico, "nombre" | "variantes" | "varianteNombre" | "varianteUnidad">,
): string {
  if (!producto) {
    return ["Hola, quisiera hacer un pedido.", "Pedido: ", "Dirección de entrega: "].join("\n");
  }

  // La presentacion solo si hay una y dice algo. "(Unidad)" seguido de
  // "Cantidad:" se contradice, y con varias la predeterminada no tiene por que
  // ser la que quiere el cliente.
  const presentacion = producto.variantes === 1 ? describirPresentacion(producto) : null;
  const detalle = presentacion ? ` (${presentacion.toLowerCase()})` : "";
  return [
    `Hola, quisiera pedir ${producto.nombre}${detalle}.`,
    "Cantidad: ",
    "Dirección de entrega: ",
  ].join("\n");
}
