import * as z from "zod";

import { casilla, json, texto } from "@/lib/panel/formulario";

import { normalizarPrecio } from "./producto";

/**
 * El esquema del panel de configuración (R21).
 *
 * Vive separado de `esquemaConfiguracion` (`src/lib/datos/configuracion.ts`)
 * porque ese valida lo que YA está guardado, tolerante a lo que falte, y este
 * valida lo que una persona escribe en un formulario: exige, normaliza y
 * explica en español qué corregir. La prueba de este archivo comprueba que
 * los dos hablan el mismo idioma: todo lo que sale de aquí lo acepta el otro,
 * sin caer a los valores de reserva.
 */
const HORA = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Escribe la hora como 04:00." });

const TRAMO = z.object({ desde: HORA, hasta: HORA }).refine((t) => t.hasta > t.desde, {
  error: "La hora de cierre tiene que ser después de la de apertura.",
});

const DIA = z
  .array(TRAMO)
  .max(2, { error: "Cada día tiene como mucho dos turnos." })
  .refine((t) => t.length < 2 || t[1]!.desde >= t[0]!.hasta, {
    error: "El segundo turno tiene que empezar después de que termine el primero.",
  });

const MONTO = (vacio: string) =>
  z
    .string()
    .transform(normalizarPrecio)
    .pipe(
      z
        .string()
        .min(1, { error: vacio })
        .regex(/^\d{1,4}(\.\d{1,2})?$/, {
          error: "Escribe el monto con números, por ejemplo 3.50.",
        }),
    )
    .transform(Number);

const RED = z.string().refine((v) => v === "" || v.startsWith("https://"), {
  error: "Pega el enlace completo, empezando por https://",
});

const RUTA_ARCHIVO = z.string().min(1, { error: "Falta el archivo." });

export const esquemaConfiguracionPanel = z.object({
  // Contacto
  telefono: z.string().max(30),
  whatsapp: z
    .string()
    .transform((v) => {
      const digitos = v.replace(/\D/g, "");
      return digitos.length === 9 ? `51${digitos}` : digitos;
    })
    .pipe(
      z.string().regex(/^519\d{8}$/, {
        error: "Escribe el celular de WhatsApp de 9 dígitos, por ejemplo 947 874 820.",
      }),
    ),
  correo: z.email({ error: "Ese correo no parece válido." }),
  correo_alertas: z.email({ error: "Ese correo no parece válido." }),
  dias_aviso_vencimiento: z
    .number({ error: "Escribe un número de días." })
    .int({ error: "Escribe un número entero de días." })
    .min(1, { error: "Entre 1 y 90 días." })
    .max(90, { error: "Entre 1 y 90 días." }),

  // Ubicación
  direccion: z.string().min(1, { error: "Escribe la dirección." }),
  referencia: z.string().max(120),
  distrito: z.string().min(1, { error: "Escribe el distrito." }),
  provincia: z.string(),
  departamento: z.string(),
  coordenadas: z.object(
    { lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) },
    { error: "Marca el local en el mapa." },
  ),

  // Horarios
  horario_semanal: z.object({
    lunes: DIA,
    martes: DIA,
    miercoles: DIA,
    jueves: DIA,
    viernes: DIA,
    sabado: DIA,
    domingo: DIA,
  }),
  nota_horarios: z.string().max(160),

  // Pedidos
  delivery_zonas: z.array(z.string()).min(1, { error: "Escribe al menos una zona de reparto." }),
  delivery_costo: MONTO("Escribe el costo. Pon 0 si es gratis."),
  pedido_minimo: MONTO("Escribe el pedido mínimo. Pon 0 si no hay mínimo."),
  delivery_tiempo: z.string().max(60),
  formas_pago: z.array(z.string()).min(1, { error: "Escribe al menos una forma de pago." }),

  // Redes
  facebook: RED,
  instagram: RED,

  // Marca
  nombre_comercial: z.string().min(1, { error: "Escribe el nombre del negocio." }).max(60),
  razon_social: z.string().max(120),
  eslogan: z.string().max(80),
  logo_url: RUTA_ARCHIVO,
  logo_alt: z.string().min(1, { error: "Describe el logo para quien no puede verlo." }),
  isotipo_url: RUTA_ARCHIVO,
  favicon_url: RUTA_ARCHIVO,
});

export type ValoresConfiguracion = z.output<typeof esquemaConfiguracionPanel>;

export const CLAVES_EDITABLES = Object.keys(
  esquemaConfiguracionPanel.shape,
) as (keyof ValoresConfiguracion)[];

const lineas = (valor: string) =>
  valor
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

export function leerConfiguracion(fd: FormData) {
  const valores: Record<string, unknown> = {};
  for (const clave of CLAVES_EDITABLES) valores[clave] = texto(fd, clave);

  valores.dias_aviso_vencimiento = Number(texto(fd, "dias_aviso_vencimiento"));
  valores.coordenadas = json(fd, "coordenadas");
  valores.horario_semanal = json(fd, "horario_semanal");
  valores.delivery_zonas = lineas(texto(fd, "delivery_zonas"));
  valores.formas_pago = lineas(texto(fd, "formas_pago"));

  const confirmadas = CLAVES_EDITABLES.filter((clave) => casilla(fd, `confirmar_${clave}`));
  return { valores, confirmadas };
}

export function validarConfiguracion(fd: FormData) {
  const r = esquemaConfiguracionPanel.safeParse(leerConfiguracion(fd).valores);
  return r.success
    ? {}
    : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);
}
