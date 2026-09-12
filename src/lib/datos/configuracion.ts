import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { crearClientePublico } from "@/lib/supabase/publico";

import { avisarDeConsulta } from "./aviso";
import { ETIQUETAS } from "./etiquetas";
// Ademas de reexportarse mas abajo: un `export ... from` no trae el nombre al
// ambito de este archivo, y el `satisfies` de TRAMO lo necesita aqui.
import type { Tramo } from "./reloj";

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

// `satisfies`: el esquema y el tipo de `reloj` tienen que seguir diciendo lo
// mismo. Si alguien le añade un campo a uno y no al otro, falla el typecheck en
// vez de llegar a la pagina como un turno a medias.
const TRAMO = z.object({
  desde: z.string(),
  hasta: z.string(),
}) satisfies z.ZodType<Tramo>;

const VALOR = z.object({
  nombre: z.string(),
  descripcion: z.string(),
});

// Los dias y el formato de la hora viven en `reloj.ts`, que no depende de nada:
// este archivo trae Zod, Supabase y `use cache`, y el boton de "Abierto ahora"
// es de cliente. Se reexportan para que quien ya los importaba de aqui siga
// igual.
export { DIAS, describirTramos, formatearHora } from "./reloj";
export type { Dia, Tramo } from "./reloj";

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

  // Lo que el cliente necesita saber antes de pedir (0017). Los montos van en
  // soles; `null` es "el negocio no lo cargo", y entonces no se muestra.
  delivery_zonas: z.array(z.string()).default([]),
  delivery_costo: z.number().nonnegative().nullable().default(null),
  pedido_minimo: z.number().nonnegative().nullable().default(null),
  delivery_tiempo: z.string().default(""),
  formas_pago: z.array(z.string()).default([]),
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

  if (error || !data) {
    // Sin esto, el sitio entero se sirve con los valores de reserva —sin
    // telefono, sin direccion, sin horario— y nada lo dice.
    avisarDeConsulta("configuracion_publica", error);
    return RESERVA;
  }

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
export function enlaceWhatsApp(
  config: Pick<Configuracion, "whatsapp">,
  mensaje: string,
): string | null {
  const numero = config.whatsapp.replace(/\D/g, "");
  if (numero.length === 0) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
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
