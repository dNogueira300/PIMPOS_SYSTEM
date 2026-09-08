import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { crearClientePublico } from "@/lib/supabase/publico";

import { ETIQUETAS } from "./etiquetas";

/**
 * La configuracion del sitio, administrable desde el panel (R21, R5).
 *
 * Llega como UN objeto jsonb desde `configuracion_publica`, no como 24 filas:
 * el layout necesita logo, horarios, telefono y redes en todas las paginas.
 *
 * Se valida con Zod porque estos valores los edita una persona desde un panel,
 * no un programa. Si alguien deja el telefono vacio o rompe el JSON de los
 * horarios, la pagina tiene que seguir renderizando con un valor de reserva en
 * vez de caerse entera: es la portada de un negocio, no un formulario interno.
 */

const TRAMO = z.object({
  desde: z.string(),
  hasta: z.string(),
});

const VALOR = z.object({
  nombre: z.string(),
  descripcion: z.string(),
});

/** Los siete dias, en el orden en que se leen. `domingo: []` significa cerrado. */
export const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type Dia = (typeof DIAS)[number];
export type Tramo = z.infer<typeof TRAMO>;

const ESQUEMA = z.object({
  nombre_comercial: z.string().default("Panadería Pimpo's"),
  razon_social: z.string().default(""),
  eslogan: z.string().default(""),
  logo_url: z.string().default("/marca/logo.webp"),
  logo_alt: z.string().default("Panadería Pimpo's"),
  isotipo_url: z.string().default("/marca/isotipo.svg"),
  favicon_url: z.string().default("/marca/favicon.svg"),

  telefono: z.string().default(""),
  whatsapp: z.string().default(""),
  correo: z.string().default(""),
  facebook: z.string().default(""),
  instagram: z.string().default(""),

  direccion: z.string().default(""),
  referencia: z.string().default(""),
  distrito: z.string().default(""),
  provincia: z.string().default(""),
  departamento: z.string().default(""),
  coordenadas: z.object({ lat: z.number(), lng: z.number() }).nullable().default(null),

  horario_semanal: z.record(z.string(), z.array(TRAMO)).default({}),
  nota_horarios: z.string().default(""),

  historia: z.string().default(""),
  mision: z.string().default(""),
  vision: z.string().default(""),
  valores: z.array(VALOR).default([]),
});

export type Configuracion = z.infer<typeof ESQUEMA>;

/** Lo que se usa si la base no responde. Vale para que la pagina no se caiga. */
const RESERVA: Configuracion = ESQUEMA.parse({});

export async function obtenerConfiguracion(): Promise<Configuracion> {
  "use cache";
  cacheTag(ETIQUETAS.marca);
  // Cambia poco y se lee en todas las paginas. Cuando el negocio la edita, el
  // panel invalida la etiqueta y no hay que esperar a que caduque.
  cacheLife("days");

  const supabase = crearClientePublico();
  const { data, error } = await supabase.from("configuracion_publica").select("valores").single();

  if (error || !data) return RESERVA;

  const resultado = ESQUEMA.safeParse(data.valores);
  return resultado.success ? resultado.data : RESERVA;
}

/**
 * Direccion en una linea, saltandose lo que este vacio.
 *
 * `referencia` viene vacia en la ficha y puede seguir asi mucho tiempo: unir
 * con comas a ciegas dejaria "Calle Elías Aguirre 1321, , Belén" en la portada.
 */
export function direccionCompleta(config: Configuracion): string {
  return [config.direccion, config.distrito, config.provincia, config.departamento]
    .filter((parte) => parte.trim().length > 0)
    .join(", ");
}

/**
 * Enlace de WhatsApp con el mensaje ya escrito.
 *
 * El cliente escribe poco desde el celular; llegar al chat con el mensaje
 * puesto es la diferencia entre que pregunte y que no (R4). El numero va en
 * formato internacional sin signos, que es lo que exige wa.me.
 */
export function enlaceWhatsApp(config: Configuracion, mensaje: string): string | null {
  const numero = config.whatsapp.replace(/\D/g, "");
  if (numero.length === 0) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** `04:00` a `4:00 a. m.`, como lo lee alguien que no programa. */
export function formatearHora(hora: string): string {
  const [h, m] = hora.split(":").map(Number);

  // `Number.isFinite`, no `Number.isNaN`: con la cadena vacia, `split` devuelve
  // un solo elemento, `m` llega `undefined`, y `Number.isNaN(undefined)` es
  // false. La version anterior daba por buena esa entrada y escribia
  // "12:undefined a. m." en el pie de todas las paginas.
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hora;

  const sufijo = h < 12 ? "a. m." : "p. m.";
  const doce = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${doce}:00 ${sufijo}` : `${doce}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** "4:00 a. m. a 1:00 p. m. y 4:00 p. m. a 9:00 p. m." o "Cerrado". */
export function describirTramos(tramos: readonly Tramo[]): string {
  if (tramos.length === 0) return "Cerrado";
  return tramos
    .map(({ desde, hasta }) => `${formatearHora(desde)} a ${formatearHora(hasta)}`)
    .join(" y ");
}

/**
 * El anio en curso, para el pie de pagina.
 *
 * Parece de mas envolver esto, pero con Cache Components un `new Date()` suelto
 * rompe el build: es un valor que cambia entre renderizados y Next se niega a
 * prerenderizarlo, con razon. Dentro de `use cache` queda congelado en la
 * version cacheada de la pagina, y `cacheLife("days")` se encarga de que no se
 * quede en el anio pasado.
 */
export async function anioActual(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
