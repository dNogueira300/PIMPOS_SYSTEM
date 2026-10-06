import { NOMBRE_DEL_ROL } from "@/lib/auth/roles";
import { formatearSoles } from "@/lib/insumos/formato-reporte";
import { NOMBRE_MOTIVO, NOMBRE_TIPO } from "@/lib/insumos/kardex";
import { formatearCantidad } from "@/lib/insumos/unidades";
import { formatearFechaLima } from "@/lib/panel/hora-lima";

import type { Nombres } from "./catalogo";

/** Columnas que cambian solas o que solo identifican: no son «un cambio». */
const DE_CONTROL = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "secuencia",
]);
export const esDeControl = (campo: string): boolean => DE_CONTROL.has(campo);

/**
 * Identificadores que no tienen un nombre que enseñar (un lote, un movimiento):
 * en la lista de datos serían una ristra de letras. Siguen en «Detalle técnico».
 */
const SIN_NOMBRE = new Set(["lote_id", "movimiento_id"]);
export const esIdSinNombre = (campo: string): boolean => SIN_NOMBRE.has(campo);

const ETIQUETAS: Readonly<Record<string, string>> = {
  nombre: "Nombre",
  nombre_completo: "Nombre",
  titulo: "Título",
  subtitulo: "Subtítulo",
  slug: "Dirección en el sitio",
  descripcion: "Descripción",
  resumen: "Resumen",
  contenido: "Contenido",
  pregunta: "Pregunta",
  respuesta: "Respuesta",
  texto: "Texto",
  procedencia: "De dónde es",
  estado: "Estado",
  activo: "Activo",
  destacado: "Destacado",
  orden: "Orden",
  precio: "Precio",
  moneda: "Moneda",
  unidad_venta: "Se vende por",
  es_predeterminada: "Presentación principal",
  es_principal: "Principal",
  peso_gramos: "Peso (g)",
  stock_disponible: "Disponible",
  sku: "Código",
  categoria_id: "Categoría",
  producto_id: "Producto",
  variante_id: "Presentación",
  imagen_url: "Foto",
  imagen_movil_url: "Foto para celular",
  imagen_alt: "Texto de la foto",
  alt: "Texto de la foto",
  ruta: "Archivo",
  enlace_url: "Enlace",
  texto_boton: "Texto del botón",
  enfoque: "Encuadre de la foto",
  categoria: "Categoría",
  tipo: "Tipo",
  vigencia_inicio: "Se publica desde",
  vigencia_fin: "Se publica hasta",
  aprobada_por: "Aprobada por",
  aprobada_en: "Aprobada el",
  comentario_revision: "Comentario de la revisión",
  deleted_at: "Borrado el",
  es_demo: "De ejemplo",
  clave: "Dato",
  valor: "Valor",
  grupo: "Grupo",
  es_publico: "Se ve en el sitio",
  rol: "Rol",
  celular: "Celular",
  telefono: "Teléfono",
  correo: "Correo",
  contacto: "Contacto",
  direccion: "Dirección",
  referencia: "Referencia",
  zona_id: "Zona",
  latitud: "Latitud",
  longitud: "Longitud",
  observacion: "Observación",
  cliente_id: "Cliente",
  modo: "Cómo se dio",
  otorgado_en: "Dado el",
  registrado_por: "Lo anotó",
  texto_version: "Versión del texto",
  revocado_en: "Retirado el",
  revocado_por: "Lo retiró",
  insumo_id: "Insumo",
  unidad_base_id: "Unidad",
  unidad_id: "Unidad",
  unidad_desde: "Unidad de compra",
  unidad_hacia: "Equivale en",
  factor: "Equivale a",
  presentacion: "Presentación",
  stock_minimo: "Cantidad mínima",
  es_perecible: "Vence",
  proveedor_habitual_id: "Proveedor habitual",
  proveedor_id: "Proveedor",
  almacen_id: "Almacén",
  lote_id: "Lote",
  codigo: "Código",
  fecha_vencimiento: "Vence el",
  costo_unitario: "Costo por unidad",
  costo_total: "Costo total",
  precio_unitario: "Precio por unidad",
  cantidad: "Cantidad",
  cantidad_base: "Cantidad en su unidad",
  ocurrido_en: "Cuándo pasó",
  responsable_id: "Responsable",
  documento_tipo: "Tipo de documento",
  documento_numero: "Número de documento",
  origen_consumo: "Para qué se usó",
  destino_lote: "Para qué lote",
  area_turno: "Área o turno",
  motivo_baja: "Motivo",
  autorizado_por: "La autorizó",
  sentido: "Suma o resta",
  anula_a: "Movimiento que anula",
  comentario_rechazo: "Por qué se rechazó",
  movimiento_id: "Movimiento",
  solicitado_por: "La pidió",
  resuelto_por: "La resolvió",
  resuelto_en: "Resuelta el",
  llegada: "Orden de llegada",
};

/** «Precio»; para un campo que nadie ha nombrado, su nombre técnico sin guiones. */
export function etiquetaDe(campo: string): string {
  const conocida = ETIQUETAS[campo];
  if (conocida) return conocida;
  const legible = campo.replace(/_/g, " ").trim();
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}

const DINERO = new Set(["precio", "precio_unitario", "costo_unitario", "costo_total"]);
const FECHA_Y_HORA = new Set([
  "vigencia_inicio",
  "vigencia_fin",
  "aprobada_en",
  "deleted_at",
  "otorgado_en",
  "revocado_en",
  "ocurrido_en",
  "resuelto_en",
]);
const SOLO_FECHA = new Set(["fecha_vencimiento"]);
/** Dinero por unidad base (un gramo, un mililitro): puede valer menos de un céntimo. */
const DINERO_FINO = new Set(["precio_unitario", "costo_unitario"]);
/** Un punto del mapa: seis decimales son unos 11 cm; con cuatro, corregirlo unos metros no se vería. */
const COORDENADA = new Set(["latitud", "longitud"]);
/**
 * Campos que guardan el id de otra cosa, y en qué tabla está su nombre. Así
 * cada id se busca solo donde puede estar (`resolverNombres`).
 */
const SEÑALA_A: Readonly<Record<string, string>> = {
  categoria_id: "categorias_producto",
  producto_id: "productos",
  variante_id: "producto_variantes",
  zona_id: "zonas_reparto",
  cliente_id: "clientes",
  insumo_id: "insumos",
  unidad_base_id: "unidades_medida",
  unidad_id: "unidades_medida",
  unidad_desde: "unidades_medida",
  unidad_hacia: "unidades_medida",
  proveedor_habitual_id: "proveedores",
  proveedor_id: "proveedores",
  almacen_id: "almacenes",
  // De un lote se enseña el insumo: un lote no tiene nombre propio.
  lote_id: "lotes_insumo",
  aprobada_por: "perfiles",
  registrado_por: "perfiles",
  revocado_por: "perfiles",
  responsable_id: "perfiles",
  autorizado_por: "perfiles",
  solicitado_por: "perfiles",
  resuelto_por: "perfiles",
};

/** La tabla donde está el nombre de lo que este campo señala, o `null` si no señala nada. */
export const tablaQueSenala = (campo: string): string | null =>
  Object.hasOwn(SEÑALA_A, campo) ? SEÑALA_A[campo]! : null;

/** Los campos que guardan el id de otra cosa: el redactor busca su nombre. */
export const senalaAOtro = (campo: string): boolean => tablaQueSenala(campo) !== null;

const PALABRAS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  estado: {
    borrador: "Borrador",
    en_revision: "En revisión",
    publicado: "Publicado",
    archivado: "Archivado",
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
  },
  rol: NOMBRE_DEL_ROL,
  motivo_baja: NOMBRE_MOTIVO,
  tipo: {
    ...NOMBRE_TIPO,
    promocion: "Promoción",
    nuevo_producto: "Producto nuevo",
    campania: "Campaña",
    evento: "Evento",
    aviso: "Aviso",
  },
  sentido: { "1": "Suma", "-1": "Resta" },
  moneda: { PEN: "Soles", USD: "Dólares" },
  origen_consumo: { produccion: "Producción", retiro_directo: "Retiro directo" },
  modo: { verbal: "De palabra", escrito: "Por escrito", digital: "Digital" },
};

/** Un objeto o una lista (el horario, los valores del negocio), en texto corrido. */
function legible(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (Array.isArray(valor)) return valor.length === 0 ? "—" : valor.map(legible).join(", ");
  if (typeof valor === "object") {
    const partes = Object.entries(valor).map(([clave, v]) => `${clave}: ${legible(v)}`);
    return partes.length === 0 ? "—" : partes.join("; ");
  }
  return String(valor);
}

/** Un valor del registro, escrito para una persona. Nunca lanza. */
export function escribirValor(campo: string, valor: unknown, nombres: Nombres): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "object") return legible(valor);

  const crudo = String(valor).trim();
  if (crudo === "") return "—";

  if (DINERO.has(campo)) {
    const n = Number(crudo);
    if (!Number.isFinite(n)) return crudo;
    if (!DINERO_FINO.has(campo)) return formatearSoles(n);
    // Con dos decimales, 0.0035 saldría «S/ 0.00». Se quitan los ceros de
    // sobra, nunca los dos decimales de un precio.
    const [entero = "0", decimales = ""] = Math.abs(n).toFixed(6).split(".");
    const finos = decimales.replace(/0+$/, "").padEnd(2, "0");
    if (finos.length === 2) return formatearSoles(n);
    return `S/ ${n < 0 ? "-" : ""}${Number(entero).toLocaleString("en-US")}.${finos}`;
  }
  if (COORDENADA.has(campo)) {
    const n = Number(crudo);
    return Number.isFinite(n) ? String(Number(n.toFixed(6))) : crudo;
  }
  if (campo === "anula_a") return "un movimiento anterior";
  if (FECHA_Y_HORA.has(campo)) return formatearFechaLima(crudo) || crudo;
  if (SOLO_FECHA.has(campo)) {
    const [anio, mes, dia] = crudo.slice(0, 10).split("-");
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : crudo;
  }
  if (senalaAOtro(campo)) {
    return (
      nombres[crudo] ??
      (tablaQueSenala(campo) === "perfiles"
        ? "alguien que ya no tiene cuenta"
        : "algo que ya no existe")
    );
  }

  const palabras = Object.hasOwn(PALABRAS, campo) ? PALABRAS[campo] : undefined;
  if (palabras && Object.hasOwn(palabras, crudo)) return palabras[crudo]!;

  if (typeof valor === "number") return formatearCantidad(valor);
  return crudo;
}

/** Para la lista: lo largo se corta con «…». El detalle lo enseña entero. */
export function recortar(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1)}…`;
}
