import { tablaQueSenala } from "./campos";

/**
 * Qué es cada tabla auditada, para decirlo en llano en el historial (F7).
 *
 * La lista de tablas es la que fija `supabase/tests/0045_historial.test.sql`:
 * si una migración audita una tabla nueva, esa prueba falla y manda aquí. Una
 * tabla sin entrada no rompe nada —se dice «un registro de …»—, pero tampoco
 * sale en la lista llana hasta que alguien le dé su frase.
 */
export type Datos = Record<string, unknown>;
/** Nombres de los registros a los que apunta una fila, por su id (los resuelve `datos.ts`). */
export type Nombres = Readonly<Record<string, string>>;

export type Seccion =
  "productos" | "novedades" | "contenido" | "configuracion" | "insumos" | "clientes" | "usuarios";

export const SECCIONES: readonly { valor: Seccion; nombre: string }[] = [
  { valor: "productos", nombre: "Productos" },
  { valor: "novedades", nombre: "Novedades y portada" },
  { valor: "contenido", nombre: "Contenido del sitio" },
  { valor: "configuracion", nombre: "Configuración" },
  { valor: "insumos", nombre: "Insumos" },
  { valor: "clientes", nombre: "Clientes" },
  { valor: "usuarios", nombre: "Usuarios" },
];

export type InfoTabla = {
  conocida: boolean;
  seccion: Seccion | null;
  /** Mecanismo interno: fuera de la lista llana, visible en el detalle técnico. */
  interna: boolean;
  /** «el producto Pan francés», «una foto de la casa de Rosa Quispe». Nunca falla. */
  referencia: (d: Datos, n: Nombres) => string;
  /** A dónde lleva «Ir a…». Sin ella, el cambio no tiene pantalla propia. */
  ruta?: (d: Datos) => string | null;
};

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** «el producto Pan francés»; sin nombre (fila tachada o vacía), «un producto». */
const conNombre =
  (definido: string, indefinido: string, campo = "nombre") =>
  (d: Datos): string => {
    const nombre = texto(d[campo]);
    return nombre ? `${definido} ${nombre}` : indefinido;
  };

/** El nombre del registro al que apunta `campo`, o que ya no existe. */
const dueno = (d: Datos, n: Nombres, campo: string, siFalta: string): string => {
  const id = texto(d[campo]);
  return (id && n[id]) || siFalta;
};

const aRuta =
  (base: string, campo = "id") =>
  (d: Datos): string | null => {
    const id = texto(d[campo]);
    return id ? `${base}/${id}` : null;
  };

type Entrada = Omit<InfoTabla, "conocida" | "interna"> & { interna?: true };

/** Cada dato de la configuración, como lo llama su formulario. */
const DATOS_DE_CONFIGURACION: Readonly<Record<string, string>> = {
  correo: "el correo de contacto",
  correo_alertas: "el correo de los avisos",
  dias_aviso_vencimiento: "los días de aviso de vencimiento",
  telefono: "el teléfono",
  whatsapp: "el número de WhatsApp",
  horario_semanal: "el horario de atención",
  nota_horarios: "la nota del horario",
  anio_fundacion: "el año de apertura",
  eslogan: "el eslogan",
  favicon_url: "el icono de la pestaña",
  isotipo_url: "el isotipo",
  logo_alt: "la descripción del logo",
  logo_url: "el logo",
  nombre_comercial: "el nombre comercial",
  razon_social: "la razón social",
  delivery_costo: "el costo del delivery",
  delivery_tiempo: "el tiempo del delivery",
  delivery_zonas: "las zonas del delivery",
  formas_pago: "las formas de pago",
  pedido_minimo: "el pedido mínimo",
  facebook: "el enlace de Facebook",
  instagram: "el enlace de Instagram",
  historia: "la historia del negocio",
  mision: "la misión",
  valores: "los valores del negocio",
  vision: "la visión",
  coordenadas: "el punto del local en el mapa",
  departamento: "el departamento",
  direccion: "la dirección del local",
  distrito: "el distrito",
  provincia: "la provincia",
  referencia: "la referencia del local",
};

const TABLAS: Readonly<Record<string, Entrada>> = {
  // --- Productos ---
  productos: {
    seccion: "productos",
    referencia: conNombre("el producto", "un producto"),
    ruta: aRuta("/admin/contenido/productos"),
  },
  producto_variantes: {
    seccion: "productos",
    referencia: (d, n) =>
      `${conNombre("la presentación", "una presentación")(d)} de ${dueno(d, n, "producto_id", "un producto que ya no existe")}`,
    ruta: aRuta("/admin/contenido/productos", "producto_id"),
  },
  producto_imagenes: {
    seccion: "productos",
    referencia: (d, n) =>
      `una foto de ${dueno(d, n, "producto_id", "un producto que ya no existe")}`,
    ruta: aRuta("/admin/contenido/productos", "producto_id"),
  },
  categorias_producto: {
    seccion: "productos",
    referencia: conNombre("la categoría", "una categoría"),
    ruta: aRuta("/admin/contenido/categorias"),
  },
  // --- Novedades y portada ---
  novedades: {
    seccion: "novedades",
    referencia: conNombre("la novedad", "una novedad", "titulo"),
    ruta: aRuta("/admin/contenido/novedades"),
  },
  slides: {
    seccion: "novedades",
    referencia: conNombre("la diapositiva de portada", "una diapositiva de portada", "titulo"),
    ruta: aRuta("/admin/contenido/portada"),
  },
  // --- Contenido del sitio ---
  faqs: {
    seccion: "contenido",
    referencia: conNombre("la pregunta", "una pregunta frecuente", "pregunta"),
    ruta: aRuta("/admin/contenido/preguntas"),
  },
  galeria: {
    seccion: "contenido",
    referencia: conNombre("la foto de galería", "una foto de la galería", "titulo"),
    ruta: aRuta("/admin/contenido/galeria"),
  },
  guias: {
    seccion: "contenido",
    referencia: conNombre("la guía", "una guía", "titulo"),
    ruta: aRuta("/admin/contenido/guias"),
  },
  testimonios: {
    seccion: "contenido",
    referencia: conNombre("el testimonio de", "un testimonio"),
    ruta: aRuta("/admin/contenido/testimonios"),
  },
  // --- Configuración ---
  configuracion_sitio: {
    seccion: "configuracion",
    referencia: (d) => {
      const clave = texto(d.clave);
      if (!clave) return "un dato de la configuración";
      const nombre = Object.hasOwn(DATOS_DE_CONFIGURACION, clave)
        ? DATOS_DE_CONFIGURACION[clave]
        : null;
      return nombre ? `${nombre}, en la configuración` : `el dato «${clave}» de la configuración`;
    },
    ruta: () => "/admin/configuracion",
  },
  // --- Insumos ---
  insumos: {
    seccion: "insumos",
    referencia: conNombre("el insumo", "un insumo"),
    ruta: aRuta("/admin/insumos"),
  },
  equivalencias: {
    seccion: "insumos",
    referencia: (d, n) =>
      `una unidad de compra de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: aRuta("/admin/insumos", "insumo_id"),
  },
  proveedores: {
    seccion: "insumos",
    referencia: conNombre("el proveedor", "un proveedor"),
    ruta: aRuta("/admin/insumos/proveedores"),
  },
  movimientos_insumo: {
    seccion: "insumos",
    referencia: (d, n) =>
      `un movimiento de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: aRuta("/admin/insumos", "insumo_id"),
  },
  solicitudes_baja: {
    seccion: "insumos",
    referencia: (d, n) =>
      `la baja pedida de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
    ruta: () => "/admin/insumos/bajas",
  },
  lotes_insumo: {
    seccion: "insumos",
    interna: true,
    referencia: (d, n) => `un lote de ${dueno(d, n, "insumo_id", "un insumo que ya no existe")}`,
  },
  movimiento_lotes: {
    seccion: "insumos",
    interna: true,
    referencia: () => "el reparto de un movimiento entre lotes",
  },
  almacenes: {
    seccion: "insumos",
    interna: true,
    referencia: conNombre("el almacén", "un almacén"),
  },
  // --- Clientes ---
  clientes: {
    seccion: "clientes",
    referencia: conNombre("el cliente", "un cliente", "nombre_completo"),
    ruta: aRuta("/admin/clientes"),
  },
  cliente_fotos: {
    seccion: "clientes",
    referencia: (d, n) =>
      `una foto de la casa de ${dueno(d, n, "cliente_id", "un cliente que ya no está")}`,
    ruta: aRuta("/admin/clientes", "cliente_id"),
  },
  consentimientos: {
    seccion: "clientes",
    referencia: (d, n) => `el permiso de ${dueno(d, n, "cliente_id", "un cliente que ya no está")}`,
    ruta: aRuta("/admin/clientes", "cliente_id"),
  },
  zonas_reparto: {
    seccion: "clientes",
    referencia: conNombre("la zona", "una zona"),
    ruta: aRuta("/admin/clientes/zonas"),
  },
  // --- Usuarios ---
  perfiles: {
    seccion: "usuarios",
    referencia: conNombre("la cuenta de", "una cuenta", "nombre_completo"),
    ruta: aRuta("/admin/usuarios"),
  },
  roles: {
    seccion: "usuarios",
    interna: true,
    referencia: conNombre("el rol", "un rol"),
  },
};

export const TABLAS_AUDITADAS: readonly string[] = Object.keys(TABLAS).sort();

/** `tabla` llega como en el registro: `public.productos`. */
export function infoDeTabla(tabla: string): InfoTabla {
  const nombre = tabla.replace(/^public\./, "");
  const entrada = TABLAS[nombre];
  if (!entrada) {
    return {
      conocida: false,
      seccion: null,
      interna: true,
      referencia: () => `un registro de ${nombre}`,
    };
  }
  return { ...entrada, conocida: true, interna: entrada.interna === true };
}

/** Las tablas de la lista llana, de todas las secciones o de una. Con su esquema. */
export function tablasVisibles(seccion?: Seccion): string[] {
  return Object.entries(TABLAS)
    .filter(([, t]) => !t.interna && (!seccion || t.seccion === seccion))
    .map(([nombre]) => `public.${nombre}`);
}

/**
 * «Ver historial» de un producto, un insumo o un cliente: sus propios cambios
 * (`registro_id`) más los de lo que cuelga de él, que lo señalan con `campo`.
 */
export const HIJOS_DE = {
  producto: { tabla: "public.productos", campo: "producto_id" },
  insumo: { tabla: "public.insumos", campo: "insumo_id" },
  cliente: { tabla: "public.clientes", campo: "cliente_id" },
} as const;
export type Dueno = keyof typeof HIJOS_DE;

/**
 * Las tablas que tienen la pantalla de UN registro (`/…/<id>`), que es a donde
 * lleva «Ir a donde se hizo». Todas llevan `deleted_at`. Lista cerrada: es la
 * única de la que `existeDestino` acepta un nombre de tabla, y una prueba
 * comprueba que ninguna ruta del catálogo lleve a una tabla que no esté aquí.
 */
export const TABLAS_CON_PANTALLA: readonly string[] = [
  "productos",
  "categorias_producto",
  "novedades",
  "slides",
  "faqs",
  "galeria",
  "guias",
  "testimonios",
  "insumos",
  "proveedores",
  "clientes",
  "zonas_reparto",
  "perfiles",
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El registro al que lleva «Ir a donde se hizo», para preguntarle a la base si
 * sigue existiendo: el propio (un producto) o su dueño (una presentación lleva
 * a su producto). `null` si lleva a una lista, que siempre existe, o a ninguna
 * parte.
 */
export function destinoDe(tabla: string, d: Datos): { tabla: string; id: string } | null {
  const id = infoDeTabla(tabla).ruta?.(d)?.split("/").pop() ?? "";
  if (!UUID.test(id)) return null;
  if (d.id === id) return { tabla: tabla.replace(/^public\./, ""), id };
  for (const [campo, valor] of Object.entries(d)) {
    const señalada = tablaQueSenala(campo);
    if (valor === id && señalada) return { tabla: señalada, id };
  }
  return null;
}
